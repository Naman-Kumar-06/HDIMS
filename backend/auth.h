/**
 * Authentication related functionality for HDIMS
 */

#ifndef HDIMS_AUTH_H
#define HDIMS_AUTH_H

#include <string>
#include <mutex>
#include <unordered_map>
#include <chrono>
#include <optional>
#include "crow.h"
#include "database.h"

namespace hdims {

// User role enumeration
enum class UserRole {
    UNKNOWN,
    PATIENT,
    DOCTOR,
    ADMIN
};

// User information structure
struct UserInfo {
    std::string uid;
    std::string email;
    std::string name;
    UserRole role;
    bool active;
};

// Cache entry for Firebase token verification
struct TokenCacheEntry {
    std::string uid;
    std::chrono::system_clock::time_point expiry;
};

class Auth {
public:
    // Singleton pattern
    static Auth& getInstance() {
        static Auth instance;
        return instance;
    }
    
    // Initialize Firebase authentication
    void init();
    
    // Verify Firebase token and extract user ID
    std::optional<std::string> verifyToken(const std::string& token);
    
    // Get user information from database based on Firebase UID
    std::optional<UserInfo> getUserInfo(const std::string& uid);
    
    // Register a new user in the system
    bool registerUser(const std::string& uid, const std::string& email, const std::string& name, const std::string& role);
    
    // Check if a user with the given UID exists
    bool userExists(const std::string& uid);
    
    // Extract token from Authorization header
    static std::string extractToken(const crow::request& req);
    
    // Convert role string to UserRole enum
    static UserRole roleFromString(const std::string& role);
    
    // Convert UserRole enum to string
    static std::string roleToString(UserRole role);
    
    // Authorization middleware for Crow
    struct AuthMiddleware {
        struct context {};
        
        void before_handle(crow::request& req, crow::response& res, context& ctx);
        void after_handle(crow::request& req, crow::response& res, context& ctx);
    };
    
private:
    Auth() = default;
    ~Auth() = default;
    Auth(const Auth&) = delete;
    Auth& operator=(const Auth&) = delete;
    
    // Verify token with Firebase
    std::optional<std::string> verifyTokenWithFirebase(const std::string& token);
    
    // Add token to cache
    void cacheToken(const std::string& token, const std::string& uid, int expirySeconds);
    
    // Check if token is in cache
    std::optional<std::string> getFromCache(const std::string& token);
    
    // Clear expired tokens from cache
    void cleanupTokenCache();
    
    // Token cache
    std::unordered_map<std::string, TokenCacheEntry> tokenCache;
    std::mutex cacheMutex;
    
    // Firebase verification script path
    std::string firebaseVerificationScript;
};

} // namespace hdims

#endif // HDIMS_AUTH_H
