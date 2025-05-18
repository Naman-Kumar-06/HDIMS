cmake_minimum_required(VERSION 3.10)
project(HDIMS)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# Find required packages
find_package(nlohmann_json REQUIRED)
find_package(MySQL REQUIRED)

# Source files
set(SOURCES
    main.cpp
    auth.cpp
    database.cpp
    routes.cpp
    data_manager.cpp
)

# Create executable
add_executable(hdims_server ${SOURCES})

# Link libraries
target_link_libraries(hdims_server
    PRIVATE
    nlohmann_json::nlohmann_json
    ${MYSQL_LIBRARIES}
    pthread
)

# Install target
install(TARGETS hdims_server DESTINATION bin)