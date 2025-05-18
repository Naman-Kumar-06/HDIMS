/**
 * Implementation of API routes for HDIMS
 */

#include "routes.h"
#include "database.h"
#include "auth.h"
#include <iostream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace hdims {

void setupRoutes(crow::App<crow::CORSHandler>& app) {
    // Add authentication middleware to the app
    app.get_middleware<crow::CORSHandler>()
        .global()
        .headers("Content-Type", "Authorization")
        .methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .origin("*");
    
    // Set up route groups
    setupAuthRoutes(app);
    setupPatientRoutes(app);
    setupDoctorRoutes(app);
    setupAdminRoutes(app);
    setupAppointmentRoutes(app);

    // Error handler for 404 Not Found
    app.error_handler = [](crow::response& res, int errorCode) {
        if (errorCode == 404) {
            res.code = 404;
            res.write("API endpoint not found");
            res.end();
        }
    };
}

void setupAuthRoutes(crow::App<crow::CORSHandler>& app) {
    // Auth routes - no middleware needed for these
    
    // Check user role
    app.route("/auth/role").methods("GET"_method)
    ([](const crow::request& req) {
        std::string token = Auth::extractToken(req);
        
        if (token.empty()) {
            return createResponse(401, "No authentication token provided", false);
        }
        
        auto uid = Auth::getInstance().verifyToken(token);
        if (!uid) {
            return createResponse(401, "Invalid authentication token", false);
        }
        
        auto userInfo = Auth::getInstance().getUserInfo(*uid);
        if (!userInfo) {
            return createResponse(404, "User not found", false);
        }
        
        crow::json::wvalue result;
        result["success"] = true;
        result["role"] = Auth::roleToString(userInfo->role);
        result["name"] = userInfo->name;
        
        crow::response res;
        res.code = 200;
        res.set_header("Content-Type", "application/json");
        res.body = result.dump();
        return res;
    });
    
    // Register new user
    app.route("/auth/register").methods("POST"_method)
    ([](const crow::request& req) {
        auto bodyData = crow::json::load(req.body);
        
        if (!bodyData) {
            return createResponse(400, "Invalid JSON data", false);
        }
        
        if (!bodyData.has("uid") || !bodyData.has("email") || 
            !bodyData.has("name") || !bodyData.has("role")) {
            return createResponse(400, "Missing required fields", false);
        }
        
        std::string uid = bodyData["uid"].s();
        std::string email = bodyData["email"].s();
        std::string name = bodyData["name"].s();
        std::string role = bodyData["role"].s();
        
        // Check if user already exists
        if (Auth::getInstance().userExists(uid)) {
            return createResponse(409, "User already exists", false);
        }
        
        // Register the user
        if (Auth::getInstance().registerUser(uid, email, name, role)) {
            crow::json::wvalue result;
            result["success"] = true;
            result["message"] = "User registered successfully";
            
            crow::response res;
            res.code = 201;
            res.set_header("Content-Type", "application/json");
            res.body = result.dump();
            return res;
        } else {
            return createResponse(500, "Failed to register user", false);
        }
    });
}

void setupPatientRoutes(crow::App<crow::CORSHandler>& app) {
    // Get patient profile
    app.route("/patients/profile").methods("GET"_method)
    ([](const crow::request& req) {
        if (!hasRole(req, UserRole::PATIENT)) {
            return createResponse(403, "Access denied: Patient role required", false);
        }
        
        std::string uid = getUserId(req);
        
        // Mock response for now
        crow::json::wvalue result;
        result["name"] = getUserName(req);
        result["email"] = req.get_header_value("X-User-Email");
        result["phone"] = "555-123-4567";
        result["created_at"] = "2025-01-15T10:30:00";
        
        // Stats
        crow::json::wvalue stats;
        stats["total_appointments"] = 5;
        stats["upcoming_appointments"] = 2;
        stats["medical_records"] = 8;
        result["stats"] = stats;
        
        return createDataResponse(200, result);
    });
}

void setupDoctorRoutes(crow::App<crow::CORSHandler>& app) {
    // Get doctor profile
    app.route("/doctors/profile").methods("GET"_method)
    ([](const crow::request& req) {
        if (!hasRole(req, UserRole::DOCTOR)) {
            return createResponse(403, "Access denied: Doctor role required", false);
        }
        
        std::string uid = getUserId(req);
        
        // Mock response for now
        crow::json::wvalue result;
        result["name"] = getUserName(req);
        result["email"] = req.get_header_value("X-User-Email");
        result["specialization"] = "General Medicine";
        result["phone"] = "555-987-6543";
        
        // Stats
        crow::json::wvalue stats;
        stats["today_appointments"] = 3;
        stats["urgent_cases"] = 1;
        stats["total_patients"] = 25;
        stats["rating"] = 4.8;
        result["stats"] = stats;
        
        return createDataResponse(200, result);
    });
    
    // Get available doctors
    app.route("/doctors/available").methods("GET"_method)
    ([](const crow::request& req) {
        // Mock response
        crow::json::wvalue result;
        crow::json::wvalue doctors = crow::json::wvalue::list();
        
        for (int i = 1; i <= 5; i++) {
            crow::json::wvalue doctor;
            doctor["id"] = i;
            doctor["name"] = "Doctor " + std::to_string(i);
            doctor["specialization"] = i % 2 == 0 ? "Cardiology" : "General Medicine";
            doctor["rating"] = 4.0 + (i % 10) / 10.0;
            doctors[i-1] = std::move(doctor);
        }
        
        result["doctors"] = std::move(doctors);
        return createDataResponse(200, result);
    });
}

void setupAdminRoutes(crow::App<crow::CORSHandler>& app) {
    // Get admin profile
    app.route("/admins/profile").methods("GET"_method)
    ([](const crow::request& req) {
        if (!hasRole(req, UserRole::ADMIN)) {
            return createResponse(403, "Access denied: Admin role required", false);
        }
        
        std::string uid = getUserId(req);
        
        // Mock response for now
        crow::json::wvalue result;
        result["name"] = getUserName(req);
        result["email"] = req.get_header_value("X-User-Email");
        
        return createDataResponse(200, result);
    });
    
    // Get system metrics
    app.route("/admin/metrics").methods("GET"_method)
    ([](const crow::request& req) {
        if (!hasRole(req, UserRole::ADMIN)) {
            return createResponse(403, "Access denied: Admin role required", false);
        }
        
        // Mock metrics data
        crow::json::wvalue result;
        result["total_patients"] = 150;
        result["total_doctors"] = 15;
        result["total_appointments"] = 312;
        result["completion_rate"] = 85;
        
        // Appointments by status
        crow::json::wvalue appointmentStatus;
        appointmentStatus["Completed"] = 210;
        appointmentStatus["Confirmed"] = 45;
        appointmentStatus["Pending"] = 32;
        appointmentStatus["Cancelled"] = 25;
        result["appointments_by_status"] = std::move(appointmentStatus);
        
        // Users by role
        crow::json::wvalue usersByRole;
        usersByRole["Doctors"] = 15;
        usersByRole["Patients"] = 150;
        usersByRole["Admins"] = 3;
        result["users_by_role"] = std::move(usersByRole);
        
        return createDataResponse(200, result);
    });
}

void setupAppointmentRoutes(crow::App<crow::CORSHandler>& app) {
    // Book appointment
    app.route("/appointments/book").methods("POST"_method)
    ([](const crow::request& req) {
        if (!hasRole(req, UserRole::PATIENT)) {
            return createResponse(403, "Access denied: Patient role required", false);
        }
        
        auto bodyData = crow::json::load(req.body);
        
        if (!bodyData) {
            return createResponse(400, "Invalid JSON data", false);
        }
        
        if (!bodyData.has("doctor_id") || !bodyData.has("appointment_time") || 
            !bodyData.has("reason")) {
            return createResponse(400, "Missing required fields", false);
        }
        
        // Generate appointment ID (mock implementation)
        int appointmentId = rand() % 10000 + 1000;
        
        crow::json::wvalue result;
        result["success"] = true;
        result["message"] = "Appointment booked successfully";
        result["appointment_id"] = appointmentId;
        
        return createDataResponse(201, result);
    });
    
    // Get patient appointments
    app.route("/appointments/patient").methods("GET"_method)
    ([](const crow::request& req) {
        if (!hasRole(req, UserRole::PATIENT)) {
            return createResponse(403, "Access denied: Patient role required", false);
        }
        
        std::string uid = getUserId(req);
        
        // Mock appointment data
        crow::json::wvalue result;
        crow::json::wvalue appointments = crow::json::wvalue::list();
        
        const char* statuses[] = {"pending", "confirmed", "completed", "cancelled"};
        const char* doctors[] = {"John Smith", "Sarah Johnson", "Michael Brown"};
        const char* specializations[] = {"General Medicine", "Cardiology", "Neurology"};
        
        for (int i = 1; i <= 5; i++) {
            crow::json::wvalue appointment;
            appointment["id"] = i + 1000;
            appointment["doctor_id"] = i;
            appointment["doctor_name"] = doctors[i % 3];
            appointment["specialization"] = specializations[i % 3];
            appointment["appointment_time"] = "2025-05-" + std::to_string(20 + i) + "T10:00:00";
            appointment["status"] = statuses[i % 4];
            appointments[i-1] = std::move(appointment);
        }
        
        result["appointments"] = std::move(appointments);
        return createDataResponse(200, result);
    });
    
    // Get doctor appointments
    app.route("/appointments/doctor").methods("GET"_method)
    ([](const crow::request& req) {
        if (!hasRole(req, UserRole::DOCTOR)) {
            return createResponse(403, "Access denied: Doctor role required", false);
        }
        
        std::string uid = getUserId(req);
        
        // Mock appointment data
        crow::json::wvalue result;
        crow::json::wvalue appointments = crow::json::wvalue::list();
        
        const char* statuses[] = {"pending", "confirmed", "completed", "cancelled"};
        const char* patients[] = {"Alice Johnson", "Bob Williams", "Carol Davis", "David Miller"};
        const char* urgencies[] = {"Low", "Medium", "High", "Emergency"};
        const char* reasons[] = {"Regular checkup", "Flu symptoms", "Severe headache", "Follow-up visit"};
        
        for (int i = 1; i <= 8; i++) {
            crow::json::wvalue appointment;
            appointment["id"] = i + 2000;
            appointment["patient_id"] = i;
            appointment["patient_name"] = patients[i % 4];
            appointment["appointment_time"] = "2025-05-" + std::to_string(20 + i % 10) + "T" + 
                                            std::to_string(9 + i % 8) + ":00:00";
            appointment["reason"] = reasons[i % 4];
            appointment["urgency"] = urgencies[i % 4];
            appointment["status"] = statuses[i % 4];
            appointments[i-1] = std::move(appointment);
        }
        
        result["appointments"] = std::move(appointments);
        return createDataResponse(200, result);
    });
}

crow::response createResponse(int code, const std::string& message, bool success) {
    crow::json::wvalue response;
    response["success"] = success;
    response["message"] = message;
    
    crow::response res;
    res.code = code;
    res.set_header("Content-Type", "application/json");
    res.body = response.dump();
    return res;
}

bool hasRole(const crow::request& req, UserRole role) {
    std::string userRoleStr = req.get_header_value("X-User-Role");
    UserRole userRole = Auth::roleFromString(userRoleStr);
    return userRole == role;
}

std::string getUserId(const crow::request& req) {
    return req.get_header_value("X-User-ID");
}

UserRole getUserRole(const crow::request& req) {
    std::string roleStr = req.get_header_value("X-User-Role");
    return Auth::roleFromString(roleStr);
}

std::string getUserName(const crow::request& req) {
    return req.get_header_value("X-User-Name");
}

} // namespace hdims