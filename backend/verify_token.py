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
