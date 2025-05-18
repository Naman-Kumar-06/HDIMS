/**
 * Database connection and operations for HDIMS
 */

#ifndef HDIMS_DATABASE_H
#define HDIMS_DATABASE_H

#include <string>
#include <memory>
#include <mutex>
#include <vector>
#include <sqlite3.h>
#include <stdexcept>
#include <iostream>

namespace hdims {

/**
 * Wrapper class for SQL connection management
 */
class ConnectionWrapper {
public:
    ConnectionWrapper(sql::Connection* conn) : conn(conn) {}
    ~ConnectionWrapper() = default;
    
    // Prevent copying
    ConnectionWrapper(const ConnectionWrapper&) = delete;
    ConnectionWrapper& operator=(const ConnectionWrapper&) = delete;
    
    // Prepare SQL statement
    std::shared_ptr<sql::PreparedStatement> prepareStatement(const std::string& query) {
        return std::shared_ptr<sql::PreparedStatement>(conn->prepareStatement(query));
    }
    
    // Create statement for simple queries
    std::shared_ptr<sql::Statement> createStatement() {
        return std::shared_ptr<sql::Statement>(conn->createStatement());
    }
    
    // Transaction management
    void setAutoCommit(bool autoCommit) {
        conn->setAutoCommit(autoCommit);
    }
    
    void commit() {
        conn->commit();
    }
    
    void rollback() {
        conn->rollback();
    }
    
private:
    std::unique_ptr<sql::Connection> conn;
};

/**
 * Database connection manager (Singleton)
 */
class Database {
public:
    // Get singleton instance
    static Database& getInstance() {
        static Database instance;
        return instance;
    }
    
    // Connect to the database
    void connect();
    
    // Disconnect from the database
    void disconnect();
    
    // Get a connection from the pool
    std::shared_ptr<ConnectionWrapper> getConnection();
    
    // Check if connected
    bool isConnected() const;
    
private:
    Database() = default;
    ~Database() = default;
    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;
    
    // Database connection parameters
    std::string host = "tcp://127.0.0.1:3306";
    std::string username = "root";
    std::string password = "";
    std::string database = "hdims";
    
    // Connection pool
    std::vector<std::shared_ptr<ConnectionWrapper>> connectionPool;
    
    // MySQL driver
    sql::mysql::MySQL_Driver* driver = nullptr;
    
    // Mutex for thread safety
    std::mutex mutex;
    
    // Connection status
    bool connected = false;
};

} // namespace hdims

#endif // HDIMS_DATABASE_H
