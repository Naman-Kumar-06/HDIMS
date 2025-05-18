/**
 * Collection of utility functions used across the application
 */

// Format a date string for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format a date string for display (date only)
function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format a date string for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    let month = (d.getMonth() + 1).toString().padStart(2, '0');
    let day = d.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Get the status badge class based on appointment status
function getStatusBadgeClass(status) {
    if (!status) return 'bg-secondary';
    
    switch (status.toLowerCase()) {
        case 'pending':
            return 'bg-warning text-dark';
        case 'confirmed':
            return 'bg-success';
        case 'completed':
            return 'bg-primary';
        case 'cancelled':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Get the urgency badge class based on level
function getUrgencyBadgeClass(urgency) {
    if (!urgency) return 'bg-secondary';
    
    switch (urgency.toLowerCase()) {
        case 'low':
            return 'bg-info';
        case 'medium':
            return 'bg-warning text-dark';
        case 'high':
            return 'bg-danger';
        case 'emergency':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Toggle loading state of a container
function toggleContentLoading(containerId, isLoading) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (isLoading) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading data...</p>
            </div>
        `;
    }
}

// Display error message
function displayError(message, isError = true) {
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${isError ? 'danger' : 'success'} alert-dismissible fade show`;
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    } else {
        console.log(message);
    }
}

// API request helper function
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

// Validate email format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
function isStrongPassword(password) {
    // At least 8 characters, containing at least one uppercase, one lowercase, one number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

// Generate random ID (for temporary usage)
function generateTempId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Truncate text to a specified length
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
}

// Sort array of objects by a property
function sortByProperty(array, property, descending = false) {
    return array.sort((a, b) => {
        if (a[property] < b[property]) return descending ? 1 : -1;
        if (a[property] > b[property]) return descending ? -1 : 1;
        return 0;
    });
}

// Filter array of objects by search term across multiple properties
function filterBySearchTerm(array, searchTerm, properties) {
    if (!searchTerm) return array;
    
    const term = searchTerm.toLowerCase();
    return array.filter(item => {
        return properties.some(prop => {
            const value = item[prop];
            if (typeof value === 'string') {
                return value.toLowerCase().includes(term);
            }
            return false;
        });
    });
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

// Check if JWT token is expired
function isTokenExpired(token) {
    const decodedToken = parseJwt(token);
    if (!decodedToken) return true;
    
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
}
