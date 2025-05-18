/**
 * Implementation of authentication functionality
 */

#include "auth.h"
#include "config.h"
#include <iostream>
#include <fstream>
#include <array>
#include <cstdio>
#include <memory>
#include <stdexcept>
#include <string>
#include <chrono>
#include <thread>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace hdims {

// Utility function to execute a command and get output
std::string execCommand(const std::string& command) {
    std::array<char, 128> buffer;
    std::string result;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(command.c_str(), "r"), pclose);
    
    if (!pipe) {
        throw std::runtime_error("popen() failed");
    }
    
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    
    return result;
}

void Auth::init() {
    // Check if we have a Python verification script for Firebase tokens
    std::string scriptPath = "verify_token.py";
    std::ifstream scriptFile(scriptPath);
    
    if (!scriptFile.good()) {
        // Create a Python script for verifying Firebase tokens
        std::ofstream outScript(scriptPath);
        outScript << "#!/usr/bin/env python3\n"
                  << "import sys\n"
                  << "import json\n"
                  << "import firebase_admin\n"
                  << "from firebase_admin import credentials, auth\n"
                  << "\n"
                  << "# Initialize Firebase Admin SDK if not already initialized\n"
                  << "try:\n"
                  << "    app = firebase_admin.get_app()\n"
                  << "except ValueError:\n"
                  << "    # Use default service account credentials if available, otherwise use limited privileges\n"
                  << "    firebase_admin.initialize_app()\n"
                  << "\n"
                  << "def verify_token(token):\n"
                  << "    try:\n"
                  << "        # Verify the ID token\n"
                  << "        decoded_token = auth.verify_id_token(token)\n"
                  << "        # Return the user's UID and token expiration time\n"
                  << "        return {\n"
                  << "            'success': True,\n"
                  << "            'uid': decoded_token['uid'],\n"
                  << "            'exp': decoded_token['exp']\n"
                  << "        }\n"
                  << "    except Exception as e:\n"
                  << "        return {\n"
                  << "            'success': False,\n"
                  << "            'error': str(e)\n"
                  << "        }\n"
                  << "\n"
                  << "if __name__ == '__main__':\n"
                  << "    if len(sys.argv) < 2:\n"
                  << "        print(json.dumps({'success': False, 'error': 'No token provided'}))\n"
                  << "    else:\n"
                  << "        token = sys.argv[1]\n"
                  << "        result = verify_token(token)\n"
                  << "        print(json.dumps(result))\n";
        outScript.close();
        
        // Make the script executable
        #ifdef _WIN32
        // On Windows, we don't need to change permissions
        #else
        std::string chmodCmd = "chmod +x " + scriptPath;
        std::system(chmodCmd.c_str());
        #endif
    }
    
    firebaseVerificationScript = scriptPath;
    
    // Start a background thread to periodically clean token cache
    std::thread cacheCleanupThread([this]() {
        while (true) {
            std::this_thread::sleep_for(std::chrono::minutes(10));
            cleanupTokenCache();
        }
    });
    cacheCleanupThread.detach();
}

std::optional<std::string> Auth::verifyToken(const std::string& token) {
    // First check if token is in cache
    auto cachedUid = getFromCache(token);
    if (cachedUid) {
        return cachedUid;
    }
    
    // If not in cache, verify with Firebase
    auto result = verifyTokenWithFirebase(token);
    if (result) {
        // Add to cache with 1 hour expiry (or less if token expires sooner)
        cacheToken(token, *result, 3600);
    }
    
    return result;
}

std::optional<std::string> Auth::verifyTokenWithFirebase(const std::string& token) {
    try {
        std::string command = "python3 " + firebaseVerificationScript + " \"" + token + "\"";
        std::string output = execCommand(command);
        
        // Parse JSON output
        json result = json::parse(output);
        
        if (result["success"].get<bool>()) {
            return result["uid"].get<std::string>();
        } else {
            std::cerr << "Firebase token verification failed: " << result["error"].get<std::string>() << std::endl;
            return std::nullopt;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error verifying Firebase token: " << e.what() << std::endl;
        return std::nullopt;
    }
}

void Auth::cacheToken(const std::string& token, const std::string& uid, int expirySeconds) {
    std::lock_guard<std::mutex> lock(cacheMutex);
    
    auto expiry = std::chrono::system_clock::now() + std::chrono::seconds(expirySeconds);
    tokenCache[token] = {uid, expiry};
}

std::optional<std::string> Auth::getFromCache(const std::string& token) {
    std::lock_guard<std::mutex> lock(cacheMutex);
    
    auto it = tokenCache.find(token);
    if (it != tokenCache.end()) {
        auto& entry = it->second;
        auto now = std::chrono::system_clock::now();
        
        if (entry.expiry > now) {
            return entry.uid;
        } else {
            // Token has expired, remove from cache
            tokenCache.erase(it);
        }
    }
    
    return std::nullopt;
}

void Auth::cleanupTokenCache() {
    std::lock_guard<std::mutex> lock(cacheMutex);
    
    auto now = std::chrono::system_clock::now();
    for (auto it = tokenCache.begin(); it != tokenCache.end();) {
        if (it->second.expiry <= now) {
            it = tokenCache.erase(it);
        } else {
            ++it;
        }
    }
}

std::optional<UserInfo> Auth::getUserInfo(const std::string& uid) {
    try {
        auto& db = Database::getInstance();
        auto conn = db.getConnection();
        
        std::string query = "SELECT u.uid, u.email, u.role, COALESCE(p.name, d.name, a.name) as name, "
                           "COALESCE(p.active, d.active, a.active, 1) as active "
                           "FROM users u "
                           "LEFT JOIN patients p ON u.uid = p.uid AND u.role = 'patient' "
                           "LEFT JOIN doctors d ON u.uid = d.uid AND u.role = 'doctor' "
                           "LEFT JOIN administrators a ON u.uid = a.uid AND u.role = 'admin' "
                           "WHERE u.uid = ?";
        
        auto stmt = conn->prepareStatement(query);
        stmt->setString(1, uid);
        auto result = stmt->executeQuery();
        
        if (result->next()) {
            UserInfo info;
            info.uid = result->getString("uid");
            info.email = result->getString("email");
            info.name = result->getString("name");
            info.role = roleFromString(result->getString("role"));
            info.active = result->getBoolean("active");
            
            return info;
        }
        
        return std::nullopt;
    } catch (const std::exception& e) {
        std::cerr << "Error getting user info: " << e.what() << std::endl;
        return std::nullopt;
    }
}

bool Auth::registerUser(const std::string& uid, const std::string& email, const std::string& name, const std::string& roleStr) {
    try {
        UserRole role = roleFromString(roleStr);
        if (role == UserRole::UNKNOWN) {
            return false;
        }
        
        auto& db = Database::getInstance();
        auto conn = db.getConnection();
        
        // Begin transaction
        conn->setAutoCommit(false);
        
        try {
            // Insert into users table
            std::string userQuery = "INSERT INTO users (uid, email, role) VALUES (?, ?, ?)";
            auto userStmt = conn->prepareStatement(userQuery);
            userStmt->setString(1, uid);
            userStmt->setString(2, email);
            userStmt->setString(3, roleToString(role));
            userStmt->executeUpdate();
            
            // Insert into role-specific table
            switch (role) {
                case UserRole::PATIENT: {
                    std::string patientQuery = "INSERT INTO patients (uid, name, active) VALUES (?, ?, 1)";
                    auto patientStmt = conn->prepareStatement(patientQuery);
                    patientStmt->setString(1, uid);
                    patientStmt->setString(2, name);
                    patientStmt->executeUpdate();
                    break;
                }
                case UserRole::DOCTOR: {
                    std::string doctorQuery = "INSERT INTO doctors (uid, name, active) VALUES (?, ?, 1)";
                    auto doctorStmt = conn->prepareStatement(doctorQuery);
                    doctorStmt->setString(1, uid);
                    doctorStmt->setString(2, name);
                    doctorStmt->executeUpdate();
                    break;
                }
                case UserRole::ADMIN: {
                    std::string adminQuery = "INSERT INTO administrators (uid, name, active) VALUES (?, ?, 1)";
                    auto adminStmt = conn->prepareStatement(adminQuery);
                    adminStmt->setString(1, uid);
                    adminStmt->setString(2, name);
                    adminStmt->executeUpdate();
                    break;
                }
                default:
                    throw std::runtime_error("Invalid role");
            }
            
            // Commit transaction
            conn->commit();
            return true;
        } catch (const std::exception& e) {
            // Rollback transaction on error
            conn->rollback();
            std::cerr << "Error during user registration transaction: " << e.what() << std::endl;
            return false;
        }
        
        // Restore auto-commit
        conn->setAutoCommit(true);
    } catch (const std::exception& e) {
        std::cerr << "Error registering user: " << e.what() << std::endl;
        return false;
    }
}

bool Auth::userExists(const std::string& uid) {
    try {
        auto& db = Database::getInstance();
        auto conn = db.getConnection();
        
        std::string query = "SELECT COUNT(*) as count FROM users WHERE uid = ?";
        auto stmt = conn->prepareStatement(query);
        stmt->setString(1, uid);
        auto result = stmt->executeQuery();
        
        if (result->next()) {
            return result->getInt("count") > 0;
        }
        
        return false;
    } catch (const std::exception& e) {
        std::cerr << "Error checking if user exists: " << e.what() << std::endl;
        return false;
    }
}

std::string Auth::extractToken(const crow::request& req) {
    std::string authHeader = req.get_header_value("Authorization");
    
    if (authHeader.substr(0, 7) == "Bearer ") {
        return authHeader.substr(7);
    }
    
    return "";
}

UserRole Auth::roleFromString(const std::string& role) {
    if (role == "patient") return UserRole::PATIENT;
    if (role == "doctor") return UserRole::DOCTOR;
    if (role == "admin") return UserRole::ADMIN;
    return UserRole::UNKNOWN;
}

std::string Auth::roleToString(UserRole role) {
    switch (role) {
        case UserRole::PATIENT: return "patient";
        case UserRole::DOCTOR: return "doctor";
        case UserRole::ADMIN: return "admin";
        default: return "unknown";
    }
}

void Auth::AuthMiddleware::before_handle(crow::request& req, crow::response& res, context& ctx) {
    // Skip authentication for OPTIONS requests (CORS preflight)
    if (req.method == crow::HTTPMethod::OPTIONS) {
        return;
    }
    
    // Skip authentication for registration endpoint
    if (req.url == "/auth/register") {
        return;
    }
    
    // Extract token from Authorization header
    std::string token = Auth::extractToken(req);
    
    if (token.empty()) {
        res.code = 401;
        res.write("Unauthorized: No token provided");
        res.end();
        return;
    }
    
    // Verify token
    auto uid = Auth::getInstance().verifyToken(token);
    
    if (!uid) {
        res.code = 401;
        res.write("Unauthorized: Invalid token");
        res.end();
        return;
    }
    
    // Get user info
    auto userInfo = Auth::getInstance().getUserInfo(*uid);
    
    if (!userInfo) {
        res.code = 401;
        res.write("Unauthorized: User not found");
        res.end();
        return;
    }
    
    if (!userInfo->active) {
        res.code = 403;
        res.write("Forbidden: User account is inactive");
        res.end();
        return;
    }
    
    // Store user info in request object for handlers to use
    req.add_header("X-User-ID", userInfo->uid);
    req.add_header("X-User-Role", Auth::roleToString(userInfo->role));
    req.add_header("X-User-Email", userInfo->email);
    req.add_header("X-User-Name", userInfo->name);
}

void Auth::AuthMiddleware::after_handle(crow::request& req, crow::response& res, context& ctx) {
    // Nothing to do after handling the request
}

} // namespace hdims
