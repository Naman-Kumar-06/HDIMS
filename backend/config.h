/**
 * Configuration settings for HDIMS
 */

#ifndef HDIMS_CONFIG_H
#define HDIMS_CONFIG_H

#include <string>
#include <cstdlib>

namespace hdims {

// Configuration class to handle environment variables and settings
class Config {
public:
    // Get singleton instance
    static Config& getInstance() {
        static Config instance;
        return instance;
    }
    
    // Get Firebase API key
    std::string getFirebaseApiKey() const {
        const char* apiKey = std::getenv("FIREBASE_API_KEY");
        return apiKey ? apiKey : "";
    }
    
    // Get Firebase Project ID
    std::string getFirebaseProjectId() const {
        const char* projectId = std::getenv("FIREBASE_PROJECT_ID");
        return projectId ? projectId : "";
    }
    
    // Get Firebase App ID
    std::string getFirebaseAppId() const {
        const char* appId = std::getenv("FIREBASE_APP_ID");
        return appId ? appId : "";
    }
    
    // Get server port
    int getServerPort() const {
        const char* portStr = std::getenv("SERVER_PORT");
        return portStr ? std::stoi(portStr) : 8000;
    }
    
    // Get server bind address
    std::string getServerBindAddress() const {
        const char* addr = std::getenv("SERVER_BIND_ADDR");
        return addr ? addr : "0.0.0.0";
    }
    
private:
    Config() = default;
    ~Config() = default;
    Config(const Config&) = delete;
    Config& operator=(const Config&) = delete;
};

} // namespace hdims

#endif // HDIMS_CONFIG_H