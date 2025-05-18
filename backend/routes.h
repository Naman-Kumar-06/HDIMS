/**
 * API routes and handlers for HDIMS
 */

#ifndef HDIMS_ROUTES_H
#define HDIMS_ROUTES_H

#include "crow.h"
#include "crow/middlewares/cors.h"
#include "auth.h"

namespace hdims {

// Set up all API routes
void setupRoutes(crow::App<crow::CORSHandler>& app);

// Authentication routes
void setupAuthRoutes(crow::App<crow::CORSHandler>& app);

// Patient routes
void setupPatientRoutes(crow::App<crow::CORSHandler>& app);

// Doctor routes
void setupDoctorRoutes(crow::App<crow::CORSHandler>& app);

// Admin routes
void setupAdminRoutes(crow::App<crow::CORSHandler>& app);

// Appointment routes
void setupAppointmentRoutes(crow::App<crow::CORSHandler>& app);

// Utility functions for response handling

// Create a JSON response
crow::response createResponse(int code, const std::string& message, bool success = false);

// Create a JSON response with data
template<typename T>
crow::response createDataResponse(int code, const T& data) {
    crow::json::wvalue response;
    response["success"] = true;
    response["data"] = data;
    
    crow::response res;
    res.code = code;
    res.set_header("Content-Type", "application/json");
    res.body = response.dump();
    return res;
}

// Check if the user has a specific role
bool hasRole(const crow::request& req, UserRole role);

// Extract user ID from request headers
std::string getUserId(const crow::request& req);

// Extract user role from request headers
UserRole getUserRole(const crow::request& req);

// Extract user name from request headers
std::string getUserName(const crow::request& req);

} // namespace hdims

#endif // HDIMS_ROUTES_H
