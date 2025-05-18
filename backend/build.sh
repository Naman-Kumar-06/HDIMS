#!/bin/bash

# Build script for HDIMS C++ backend

echo "Building HDIMS Backend..."

# Make sure include directory exists
mkdir -p include

# Check if we need to download Crow
if [ ! -d "include/crow" ]; then
    echo "Downloading Crow web framework..."
    wget -q https://github.com/CrowCpp/Crow/releases/download/v1.0%2B5/crow-v1.0+5.tar.gz
    tar -xzf crow-v1.0+5.tar.gz
    cp -r include/crow .
    rm -f crow-v1.0+5.tar.gz
    echo "Crow framework installed."
fi

# Check for nlohmann/json
if [ ! -d "include/nlohmann" ]; then
    echo "Downloading nlohmann/json..."
    mkdir -p include/nlohmann
    wget -q https://github.com/nlohmann/json/releases/download/v3.11.2/json.hpp -O include/nlohmann/json.hpp
    echo "JSON library installed."
fi

# Create the verify_token.py script if it doesn't exist
if [ ! -f "verify_token.py" ]; then
    echo "Creating Firebase token verification script..."
    cat > verify_token.py << 'EOF'
#!/usr/bin/env python3
import sys
import json
import firebase_admin
from firebase_admin import credentials, auth

# Initialize Firebase Admin SDK if not already initialized
try:
    app = firebase_admin.get_app()
except ValueError:
    # Initialize with default credentials
    firebase_admin.initialize_app()

def verify_token(token):
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        # Return the user's UID and token expiration time
        return {
            'success': True,
            'uid': decoded_token['uid'],
            'exp': decoded_token['exp']
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No token provided'}))
    else:
        token = sys.argv[1]
        result = verify_token(token)
        print(json.dumps(result))
EOF
    chmod +x verify_token.py
    echo "Token verification script created."
fi

# Build the server
echo "Compiling HDIMS backend..."
g++ -o server main.cpp auth.cpp database.cpp routes.cpp data_manager.cpp \
    -std=c++17 -I./include -I/usr/include/mysql -I/usr/include/cppconn \
    -lmysqlclient -lcppconn -pthread

if [ $? -eq 0 ]; then
    echo "Build successful! You can run the server with: ./server"
else
    echo "Build failed. Please check the error messages above."
fi