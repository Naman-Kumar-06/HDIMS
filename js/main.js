document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    const isLoginPage = window.location.href.includes('index.html') || window.location.pathname.endsWith('/');
    
    if (isLoginPage) {
        setupLoginPage();
    } else {
        // For dashboard pages
        setupDashboardPage();
    }
});

function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    const registerFormContainer = document.getElementById('register-form-container');
    const registerForm = document.getElementById('register-form');
    const signupLink = document.getElementById('signup-link');
    const backToLoginBtn = document.getElementById('back-to-login');
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            signInWithEmailAndPassword(email, password);
        });
    }
    
    // Toggle between login and register forms
    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            loginForm.classList.add('d-none');
            registerFormContainer.classList.remove('d-none');
        });
    }
    
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', function() {
            loginForm.classList.remove('d-none');
            registerFormContainer.classList.add('d-none');
        });
    }
    
    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const name = document.getElementById('name').value;
            const role = document.getElementById('role').value;
            
            createUserWithEmailAndPassword(email, password, name, role);
        });
    }
}

function setupDashboardPage() {
    // Set user name in the UI
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        const userName = localStorage.getItem('userName') || 'User';
        userNameElement.textContent = userName;
    }
    
    // User role badge
    const userRoleBadge = document.getElementById('user-role');
    if (userRoleBadge) {
        const userRole = localStorage.getItem('userRole') || 'Unknown';
        userRoleBadge.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    }
    
    // Setup sign out button
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            signOut();
        });
    }
    
    // Setup mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Check user authentication and role
    checkAuthenticationStatus();
}

function checkAuthenticationStatus() {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
        // No token found, redirect to login
        window.location.href = '../index.html';
        return;
    }
    
    // Check if the user is on the correct dashboard for their role
    const currentPage = window.location.pathname;
    
    if (role === 'patient' && !currentPage.includes('patient-dashboard')) {
        window.location.href = 'patient-dashboard.html';
    } else if (role === 'doctor' && !currentPage.includes('doctor-dashboard')) {
        window.location.href = 'doctor-dashboard.html';
    } else if (role === 'admin' && !currentPage.includes('admin-dashboard')) {
        window.location.href = 'admin-dashboard.html';
    }
    
    // Initialize page specific content
    initDashboardContent(role);
}

function initDashboardContent(role) {
    // Load role-specific dashboard content
    switch(role) {
        case 'patient':
            initPatientDashboard();
            break;
        case 'doctor':
            initDoctorDashboard();
            break;
        case 'admin':
            initAdminDashboard();
            break;
        default:
            console.error('Unknown role:', role);
    }
}

function displayError(message) {
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    } else {
        console.error(message);
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// API requests helper functions
function makeApiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        return Promise.reject(new Error('No authentication token found'));
    }
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    return fetch(`http://localhost:8000${endpoint}`, options)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.message || 'API request failed');
                });
            }
            return response.json();
        })
        .catch(error => {
            displayError(`API Error: ${error.message}`);
            throw error;
        });
}
