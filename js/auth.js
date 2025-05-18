// Initialize Firebase
document.addEventListener('DOMContentLoaded', function() {
    // Use the global firebaseConfig provided in index.html
    if (window.firebaseConfig) {
        firebaseConfig = window.firebaseConfig;
        initializeFirebase();
    } else {
        // Fallback to prompting for config if needed
        promptForFirebaseConfig();
    }
});

function promptForFirebaseConfig() {
    // For demo purposes, we'll use a prompt to get the configuration
    // In a real application, these would come from environment variables
    const projectId = prompt("Enter your Firebase Project ID:");
    const apiKey = prompt("Enter your Firebase API Key:");
    const appId = prompt("Enter your Firebase App ID:");
    
    if (projectId && apiKey && appId) {
        firebaseConfig = {
            apiKey: apiKey,
            authDomain: `${projectId}.firebaseapp.com`,
            projectId: projectId,
            appId: appId
        };
        
        // Save to localStorage for future use
        localStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
        
        initializeFirebase();
    } else {
        alert("Firebase configuration is required to use the application.");
    }
}

function initializeFirebase() {
    // Initialize Firebase with the config
    firebase.initializeApp(firebaseConfig);
    
    // Set up authentication state observer
    firebase.auth().onAuthStateChanged(function(user) {
        toggleLoadingOverlay(false);
        
        if (user) {
            // User is signed in
            console.log("User is signed in:", user.email);
            user.getIdToken().then(function(token) {
                localStorage.setItem('authToken', token);
                
                // Check user role from the backend
                checkUserRole(token, user.uid);
            });
        } else {
            // User is signed out
            console.log("User is signed out");
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            
            // Make sure we're on the login page
            if (!window.location.href.includes('index.html') && !window.location.pathname.endsWith('/')) {
                window.location.href = '../index.html';
            }
        }
    });
}

// Function to sign in with email and password
function signInWithEmailAndPassword(email, password) {
    toggleLoadingOverlay(true);
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch(function(error) {
            toggleLoadingOverlay(false);
            showError(`Login failed: ${error.message}`);
        });
}

// Function to create a new user with email and password
function createUserWithEmailAndPassword(email, password, name, role) {
    toggleLoadingOverlay(true);
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            // Get the user's Firebase UID
            const user = userCredential.user;
            
            // Get the ID token to send to the backend
            return user.getIdToken().then(function(token) {
                // Register the user in our backend
                return registerUserInBackend(token, user.uid, email, name, role);
            });
        })
        .catch(function(error) {
            toggleLoadingOverlay(false);
            showError(`Registration failed: ${error.message}`);
        });
}

// Function to register the user in our backend
function registerUserInBackend(token, uid, email, name, role) {
    return fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            uid: uid,
            email: email,
            name: name,
            role: role
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to register user in backend');
        }
        return response.json();
    })
    .then(data => {
        console.log('User registered in backend:', data);
        // Now check the user role
        return checkUserRole(token, uid);
    })
    .catch(error => {
        console.error('Error registering user in backend:', error);
        // Sign out the user from Firebase if backend registration fails
        firebase.auth().signOut();
        toggleLoadingOverlay(false);
        showError(`Backend registration failed: ${error.message}`);
    });
}

// Function to check the user's role from the backend
function checkUserRole(token, uid) {
    fetch('http://localhost:8000/auth/role', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to get user role');
        }
        return response.json();
    })
    .then(data => {
        const role = data.role;
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', data.name || '');
        
        // Redirect based on role
        redirectBasedOnRole(role);
    })
    .catch(error => {
        console.error('Error checking user role:', error);
        toggleLoadingOverlay(false);
        showError(`Failed to get user role: ${error.message}`);
    });
}

// Function to redirect based on user role
function redirectBasedOnRole(role) {
    let redirectUrl = '../index.html'; // Default fallback
    
    switch(role) {
        case 'patient':
            redirectUrl = 'pages/patient-dashboard.html';
            break;
        case 'doctor':
            redirectUrl = 'pages/doctor-dashboard.html';
            break;
        case 'admin':
            redirectUrl = 'pages/admin-dashboard.html';
            break;
        default:
            console.error('Unknown role:', role);
            showError('Unknown user role. Please contact administrator.');
            firebase.auth().signOut();
            return;
    }
    
    // Check if we need to navigate up a level
    if (window.location.href.includes('/pages/')) {
        // We're already in the pages directory
        redirectUrl = redirectUrl.replace('pages/', '');
    }
    
    window.location.href = redirectUrl;
}

// Function to sign out
function signOut() {
    firebase.auth().signOut()
        .then(function() {
            // Sign-out successful
            window.location.href = '../index.html';
        })
        .catch(function(error) {
            // An error happened
            console.error('Sign out error:', error);
            showError(`Sign out failed: ${error.message}`);
        });
}

// Helper function to show error messages
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorElement.classList.add('d-none');
        }, 5000);
    } else {
        // Fallback to alert if error element doesn't exist
        alert(message);
    }
}

// Helper function to toggle loading overlay
function toggleLoadingOverlay(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.remove('d-none');
        } else {
            loadingOverlay.classList.add('d-none');
        }
    }
}
