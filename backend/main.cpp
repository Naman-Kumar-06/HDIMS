/**
 * Health Data Information & Management System (HDIMS)
 * Main application entry point
 */

#include <iostream>
#include <string>
#include <memory>
#include <csignal>
#include <thread>
#include <vector>

#include "crow.h"
#include "crow/middlewares/cors.h"

#include "config.h"
#include "database.h"
#include "routes.h"
#include "auth.h"

// Signal handler for graceful shutdown
std::function<void(int)> shutdownHandler;
void signalHandler(int signal) {
    shutdownHandler(signal);
}

int main() {
    std::cout << "Starting Health Data Information & Management System (HDIMS)..." << std::endl;
    
    // Initialize database connection
    try {
        hdims::Database::getInstance().connect();
        std::cout << "Database connection established successfully." << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Failed to connect to database: " << e.what() << std::endl;
        std::cerr << "Please make sure XAMPP MySQL service is running and the database is properly configured." << std::endl;
        return 1;
    }
    
    // Initialize Firebase authentication
    try {
        hdims::Auth::getInstance().init();
        std::cout << "Firebase authentication initialized successfully." << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize Firebase authentication: " << e.what() << std::endl;
        return 1;
    }
    
    // Create and configure Crow application
    crow::App<crow::CORSHandler> app;
    
    // Configure CORS
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors
        .global()
        .headers("Content-Type", "Authorization")
        .methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .origin("*"); // In production, you'd restrict this to your frontend domain
    
    // Set up routes
    hdims::setupRoutes(app);
    
    // Configure signal handlers for graceful shutdown
    shutdownHandler = [&](int signal) {
        std::cout << "Received signal " << signal << ". Shutting down..." << std::endl;
        app.stop();
    };
    
    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);
    
    // Start the server
    std::cout << "Starting server on http://0.0.0.0:8000" << std::endl;
    std::cout << "Press Ctrl+C to stop" << std::endl;
    
    app.port(8000).bindaddr("0.0.0.0").multithreaded().run();
    
    // Clean up resources
    std::cout << "Shutting down HDIMS..." << std::endl;
    
    try {
        hdims::Database::getInstance().disconnect();
        std::cout << "Database connection closed successfully." << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error during database disconnection: " << e.what() << std::endl;
    }
    
    return 0;
}
