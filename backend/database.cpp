/**
 * Implementation of database functionality
 */

#include "database.h"
#include "config.h"
#include <iostream>
#include <cppconn/exception.h>
#include <cstdlib>
#include <unistd.h>

namespace hdims {

void Database::connect() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (connected) {
        return;
    }
    
    try {
        // Load database configuration from environment variables or use defaults
        const char* envHost = std::getenv("DB_HOST");
        const char* envUser = std::getenv("DB_USER");
        const char* envPass = std::getenv("DB_PASS");
        const char* envName = std::getenv("DB_NAME");
        
        if (envHost) host = envHost;
        if (envUser) username = envUser;
        if (envPass) password = envPass;
        if (envName) database = envName;
        
        // Get MySQL driver instance
        driver = sql::mysql::get_mysql_driver_instance();
        
        // Initialize connection pool
        const int poolSize = 5;
        for (int i = 0; i < poolSize; ++i) {
            sql::Connection* rawConn = driver->connect(host, username, password);
            rawConn->setSchema(database);
            
            auto conn = std::make_shared<ConnectionWrapper>(rawConn);
            connectionPool.push_back(conn);
        }
        
        connected = true;
    } catch (sql::SQLException& e) {
        std::string errorMessage = "MySQL Error: " + std::string(e.what()) + 
                                 " (MySQL error code: " + std::to_string(e.getErrorCode()) + 
                                 ", SQLState: " + e.getSQLState() + ")";
        throw std::runtime_error(errorMessage);
    }
}

void Database::disconnect() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!connected) {
        return;
    }
    
    // Clear connection pool
    connectionPool.clear();
    
    connected = false;
}

std::shared_ptr<ConnectionWrapper> Database::getConnection() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!connected) {
        throw std::runtime_error("Database not connected");
    }
    
    if (connectionPool.empty()) {
        // Create a new connection if pool is empty
        sql::Connection* rawConn = driver->connect(host, username, password);
        rawConn->setSchema(database);
        
        return std::make_shared<ConnectionWrapper>(rawConn);
    }
    
    // Get a connection from the pool
    auto conn = connectionPool.back();
    connectionPool.pop_back();
    
    return conn;
}

bool Database::isConnected() const {
    return connected;
}

} // namespace hdims
