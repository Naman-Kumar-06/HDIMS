/**
 * HDIMS - Health Data Information Management System
 * Main JavaScript file for client-side functionality
 */

// Global HDIMS namespace
const HDIMS = {
    // Configuration
    config: {
        searchDelay: 300,
        animationDuration: 200,
        toastDuration: 5000
    },
    
    // Utility functions
    utils: {},
    
    // Search functionality
    search: {},
    
    // Form handling
    forms: {},
    
    // UI enhancements
    ui: {},
    
    // Dashboard functionality
    dashboard: {}
};

/**
 * Utility Functions
 */
HDIMS.utils = {
    /**
     * Debounce function to limit API calls
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show toast notification
     */
    showToast: function(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${this.getIconForType(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: HDIMS.config.toastDuration
        });
        
        bsToast.show();
        
        // Remove toast element after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },

    /**
     * Create toast container if it doesn't exist
     */
    createToastContainer: function() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    },

    /**
     * Get icon for toast type
     */
    getIconForType: function(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle',
            'primary': 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    /**
     * Format date for display
     */
    formatDate: function(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },

    /**
     * Format time for display
     */
    formatTime: function(timeString) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
    },

    /**
     * Validate email format
     */
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone format
     */
    isValidPhone: function(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s|-|\(|\)/g, ''));
    },

    /**
     * Show loading state for element
     */
    showLoading: function(element, text = 'Loading...') {
        const originalContent = element.innerHTML;
        element.dataset.originalContent = originalContent;
        element.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${text}`;
        element.disabled = true;
    },

    /**
     * Hide loading state for element
     */
    hideLoading: function(element) {
        const originalContent = element.dataset.originalContent;
        if (originalContent) {
            element.innerHTML = originalContent;
            delete element.dataset.originalContent;
        }
        element.disabled = false;
    }
};

/**
 * Search Functionality
 */
HDIMS.search = {
    /**
     * Initialize search functionality
     */
    init: function() {
        this.initPatientSearch();
        this.initDoctorSearch();
        this.initDiseaseSearch();
    },

    /**
     * Initialize patient search autocomplete
     */
    initPatientSearch: function() {
        const searchInputs = document.querySelectorAll('[data-search="patients"]');
        searchInputs.forEach(input => {
            this.setupAutocomplete(input, '/api/search/patients');
        });
    },

    /**
     * Initialize doctor search autocomplete
     */
    initDoctorSearch: function() {
        const searchInputs = document.querySelectorAll('[data-search="doctors"]');
        searchInputs.forEach(input => {
            this.setupAutocomplete(input, '/api/search/doctors');
        });
    },

    /**
     * Initialize disease search autocomplete
     */
    initDiseaseSearch: function() {
        const searchInputs = document.querySelectorAll('[data-search="diseases"]');
        searchInputs.forEach(input => {
            this.setupAutocomplete(input, '/api/search/diseases');
        });
    },

    /**
     * Setup autocomplete for an input element
     */
    setupAutocomplete: function(input, endpoint) {
        const resultsContainer = this.createResultsContainer(input);
        
        const debouncedSearch = HDIMS.utils.debounce((query) => {
            if (query.length < 2) {
                this.hideResults(resultsContainer);
                return;
            }
            
            this.performSearch(query, endpoint, resultsContainer, input);
        }, HDIMS.config.searchDelay);

        input.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
                this.hideResults(resultsContainer);
            }
        });
    },

    /**
     * Create results container for autocomplete
     */
    createResultsContainer: function(input) {
        let container = input.nextElementSibling;
        if (!container || !container.classList.contains('autocomplete-results')) {
            container = document.createElement('div');
            container.className = 'autocomplete-results position-absolute bg-white border rounded shadow-sm w-100';
            container.style.zIndex = '1000';
            container.style.maxHeight = '200px';
            container.style.overflowY = 'auto';
            container.style.display = 'none';
            
            // Insert after input
            input.parentNode.style.position = 'relative';
            input.parentNode.insertBefore(container, input.nextSibling);
        }
        return container;
    },

    /**
     * Perform search API call
     */
    performSearch: function(query, endpoint, container, input) {
        fetch(`${endpoint}?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                this.displayResults(data, container, input);
            })
            .catch(error => {
                console.error('Search error:', error);
                this.hideResults(container);
            });
    },

    /**
     * Display search results
     */
    displayResults: function(results, container, input) {
        if (!results || results.length === 0) {
            this.hideResults(container);
            return;
        }

        container.innerHTML = '';
        
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item p-2 border-bottom cursor-pointer';
            item.style.cursor = 'pointer';
            
            item.innerHTML = `
                <div class="fw-bold">${result.name}</div>
                ${result.data ? `<small class="text-muted">${this.formatResultData(result.data)}</small>` : ''}
            `;
            
            item.addEventListener('click', () => {
                input.value = result.name;
                if (result.data && result.data.id) {
                    input.dataset.selectedId = result.data.id;
                }
                this.hideResults(container);
                
                // Trigger custom event
                input.dispatchEvent(new CustomEvent('autocomplete:select', {
                    detail: { result: result }
                }));
            });
            
            item.addEventListener('mouseenter', () => {
                item.classList.add('bg-light');
            });
            
            item.addEventListener('mouseleave', () => {
                item.classList.remove('bg-light');
            });
            
            container.appendChild(item);
        });
        
        container.style.display = 'block';
    },

    /**
     * Format result data for display
     */
    formatResultData: function(data) {
        if (data.type === 'patient') {
            return `Patient ID: ${data.patient_id || data.id}`;
        } else if (data.type === 'doctor') {
            return `${data.specialization || 'Doctor'} - ID: ${data.doctor_id || data.id}`;
        } else if (data.type === 'disease') {
            return data.category || 'Medical condition';
        }
        return '';
    },

    /**
     * Hide autocomplete results
     */
    hideResults: function(container) {
        container.style.display = 'none';
    }
};

/**
 * Form Handling
 */
HDIMS.forms = {
    /**
     * Initialize form enhancements
     */
    init: function() {
        this.initValidation();
        this.initPasswordStrength();
        this.initDateValidation();
        this.initPhoneFormatting();
        this.initFormSubmission();
    },

    /**
     * Initialize form validation
     */
    initValidation: function() {
        const forms = document.querySelectorAll('form[data-validate="true"]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });
    },

    /**
     * Validate entire form
     */
    validateForm: function(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    },

    /**
     * Validate individual field
     */
    validateField: function(field) {
        const value = field.value.trim();
        const type = field.type;
        let isValid = true;
        
        // Check required fields
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Type-specific validation
        if (value) {
            switch (type) {
                case 'email':
                    if (!HDIMS.utils.isValidEmail(value)) {
                        this.showFieldError(field, 'Please enter a valid email address');
                        isValid = false;
                    }
                    break;
                case 'tel':
                    if (!HDIMS.utils.isValidPhone(value)) {
                        this.showFieldError(field, 'Please enter a valid phone number');
                        isValid = false;
                    }
                    break;
                case 'password':
                    if (value.length < 6) {
                        this.showFieldError(field, 'Password must be at least 6 characters long');
                        isValid = false;
                    }
                    break;
            }
        }
        
        if (isValid) {
            this.clearFieldError(field);
        }
        
        return isValid;
    },

    /**
     * Show field error
     */
    showFieldError: function(field, message) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        let feedback = field.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            field.parentNode.appendChild(feedback);
        }
        feedback.textContent = message;
    },

    /**
     * Clear field error
     */
    clearFieldError: function(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    },

    /**
     * Initialize password strength indicator
     */
    initPasswordStrength: function() {
        const passwordInputs = document.querySelectorAll('input[type="password"][data-strength="true"]');
        passwordInputs.forEach(input => {
            this.setupPasswordStrength(input);
        });
    },

    /**
     * Setup password strength indicator
     */
    setupPasswordStrength: function(input) {
        const container = document.createElement('div');
        container.className = 'password-strength mt-2';
        container.innerHTML = `
            <div class="progress" style="height: 4px;">
                <div class="progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
            <small class="form-text text-muted">Password strength: <span class="strength-text">Weak</span></small>
        `;
        
        input.parentNode.appendChild(container);
        
        input.addEventListener('input', () => {
            this.updatePasswordStrength(input, container);
        });
    },

    /**
     * Update password strength indicator
     */
    updatePasswordStrength: function(input, container) {
        const password = input.value;
        const strength = this.calculatePasswordStrength(password);
        
        const progressBar = container.querySelector('.progress-bar');
        const strengthText = container.querySelector('.strength-text');
        
        progressBar.style.width = `${strength.percentage}%`;
        progressBar.className = `progress-bar bg-${strength.color}`;
        strengthText.textContent = strength.text;
    },

    /**
     * Calculate password strength
     */
    calculatePasswordStrength: function(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z\d]/.test(password)) score++;
        
        const strengths = [
            { text: 'Very Weak', color: 'danger', percentage: 20 },
            { text: 'Weak', color: 'danger', percentage: 40 },
            { text: 'Fair', color: 'warning', percentage: 60 },
            { text: 'Good', color: 'info', percentage: 80 },
            { text: 'Strong', color: 'success', percentage: 100 }
        ];
        
        return strengths[Math.min(score, 4)];
    },

    /**
     * Initialize date validation
     */
    initDateValidation: function() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.validateDate(input);
            });
        });
    },

    /**
     * Validate date input
     */
    validateDate: function(input) {
        const value = input.value;
        const today = new Date().toISOString().split('T')[0];
        
        if (input.hasAttribute('data-future-only') && value <= today) {
            this.showFieldError(input, 'Please select a future date');
            return false;
        }
        
        if (input.hasAttribute('data-past-only') && value >= today) {
            this.showFieldError(input, 'Please select a past date');
            return false;
        }
        
        this.clearFieldError(input);
        return true;
    },

    /**
     * Initialize phone number formatting
     */
    initPhoneFormatting: function() {
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        });
    },

    /**
     * Format phone number as user types
     */
    formatPhoneNumber: function(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
        }
        
        input.value = value;
    },

    /**
     * Initialize form submission enhancements
     */
    initFormSubmission: function() {
        const forms = document.querySelectorAll('form[data-submit-once="true"]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    HDIMS.utils.showLoading(submitBtn, 'Processing...');
                    
                    // Re-enable button after 5 seconds as failsafe
                    setTimeout(() => {
                        HDIMS.utils.hideLoading(submitBtn);
                    }, 5000);
                }
            });
        });
    }
};

/**
 * UI Enhancements
 */
HDIMS.ui = {
    /**
     * Initialize UI enhancements
     */
    init: function() {
        this.initTooltips();
        this.initPopovers();
        this.initSmoothScrolling();
        this.initCardHovers();
        this.initTableEnhancements();
        this.initModalEnhancements();
    },

    /**
     * Initialize Bootstrap tooltips
     */
    initTooltips: function() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    },

    /**
     * Initialize Bootstrap popovers
     */
    initPopovers: function() {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    },

    /**
     * Initialize smooth scrolling for anchor links
     */
    initSmoothScrolling: function() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },

    /**
     * Initialize card hover effects
     */
    initCardHovers: function() {
        const cards = document.querySelectorAll('.card[data-hover="true"]');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });
    },

    /**
     * Initialize table enhancements
     */
    initTableEnhancements: function() {
        const tables = document.querySelectorAll('table[data-enhance="true"]');
        tables.forEach(table => {
            this.enhanceTable(table);
        });
    },

    /**
     * Enhance table with sorting and filtering
     */
    enhanceTable: function(table) {
        // Add sorting functionality to table headers
        const headers = table.querySelectorAll('th[data-sortable="true"]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(table, header);
            });
        });
    },

    /**
     * Sort table by column
     */
    sortTable: function(table, header) {
        const columnIndex = Array.from(header.parentNode.children).indexOf(header);
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        const isAscending = !header.classList.contains('sort-asc');
        
        // Clear previous sort indicators
        table.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add sort indicator
        header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
        
        // Sort rows
        rows.sort((a, b) => {
            const aText = a.children[columnIndex].textContent.trim();
            const bText = b.children[columnIndex].textContent.trim();
            
            const comparison = aText.localeCompare(bText, undefined, { numeric: true });
            return isAscending ? comparison : -comparison;
        });
        
        // Re-append sorted rows
        rows.forEach(row => tbody.appendChild(row));
    },

    /**
     * Initialize modal enhancements
     */
    initModalEnhancements: function() {
        const modals = document.querySelectorAll('.modal[data-enhance="true"]');
        modals.forEach(modal => {
            modal.addEventListener('shown.bs.modal', () => {
                // Focus first input in modal
                const firstInput = modal.querySelector('input, select, textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            });
        });
    }
};

/**
 * Dashboard Functionality
 */
HDIMS.dashboard = {
    /**
     * Initialize dashboard features
     */
    init: function() {
        this.initCharts();
        this.initCounters();
        this.initRefreshButtons();
        this.initRealTimeUpdates();
    },

    /**
     * Initialize chart animations
     */
    initCharts: function() {
        // Add chart animations when they come into view
        const charts = document.querySelectorAll('canvas[data-chart="true"]');
        charts.forEach(chart => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateChart(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            });
            observer.observe(chart);
        });
    },

    /**
     * Animate chart when it comes into view
     */
    animateChart: function(canvas) {
        if (canvas.chart) {
            canvas.chart.update('show');
        }
    },

    /**
     * Initialize counter animations
     */
    initCounters: function() {
        const counters = document.querySelectorAll('[data-counter="true"]');
        counters.forEach(counter => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            });
            observer.observe(counter);
        });
    },

    /**
     * Animate counter to target value
     */
    animateCounter: function(element) {
        const target = parseInt(element.textContent);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    },

    /**
     * Initialize refresh buttons
     */
    initRefreshButtons: function() {
        const refreshButtons = document.querySelectorAll('[data-refresh="true"]');
        refreshButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.refreshDashboard();
            });
        });
    },

    /**
     * Refresh dashboard data
     */
    refreshDashboard: function() {
        HDIMS.utils.showToast('Dashboard refreshed successfully', 'success');
        
        // Animate refresh icon
        const refreshIcons = document.querySelectorAll('[data-refresh="true"] i');
        refreshIcons.forEach(icon => {
            icon.classList.add('fa-spin');
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 1000);
        });
        
        // In a real application, you would reload data here
        setTimeout(() => {
            window.location.reload();
        }, 500);
    },

    /**
     * Initialize real-time updates (placeholder)
     */
    initRealTimeUpdates: function() {
        // In a real application, you might use WebSockets or periodic AJAX calls
        // For now, this is a placeholder for future real-time functionality
        console.log('Real-time updates initialized');
    }
};

/**
 * Initialize HDIMS when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    HDIMS.search.init();
    HDIMS.forms.init();
    HDIMS.ui.init();
    HDIMS.dashboard.init();
    
    // Show success message if redirected with success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
        HDIMS.utils.showToast(urlParams.get('message') || 'Operation completed successfully', 'success');
    }
    
    // Add fade-in animation to main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('fade-in');
    }
    
    console.log('HDIMS JavaScript initialized successfully');
});

/**
 * Handle page visibility changes
 */
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Page became visible, refresh data if needed
        HDIMS.dashboard.initRealTimeUpdates();
    }
});

/**
 * Handle window resize events
 */
window.addEventListener('resize', function() {
    // Redraw charts on resize
    const charts = document.querySelectorAll('canvas');
    charts.forEach(canvas => {
        if (canvas.chart && typeof canvas.chart.resize === 'function') {
            canvas.chart.resize();
        }
    });
});

/**
 * Export HDIMS for global access
 */
window.HDIMS = HDIMS;
