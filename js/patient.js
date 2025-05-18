// Initialize Patient Dashboard
function initPatientDashboard() {
    console.log('Initializing patient dashboard');
    
    // Load patient profile
    loadPatientProfile();
    
    // Load appointments
    loadPatientAppointments();
    
    // Load available doctors for booking
    loadAvailableDoctors();
    
    // Setup appointment booking form
    setupAppointmentForm();
    
    // Setup tabs if they exist
    setupTabs();
}

function setupTabs() {
    const tabEls = document.querySelectorAll('a[data-bs-toggle="tab"]');
    
    if (tabEls.length > 0) {
        tabEls.forEach(tabEl => {
            tabEl.addEventListener('shown.bs.tab', function (event) {
                const targetId = event.target.getAttribute('href');
                
                if (targetId === '#appointments') {
                    loadPatientAppointments();
                } else if (targetId === '#book-appointment') {
                    loadAvailableDoctors();
                } else if (targetId === '#medical-history') {
                    loadMedicalHistory();
                }
            });
        });
    }
}

// Load patient profile information
function loadPatientProfile() {
    toggleContentLoading('profile-container', true);
    
    makeApiRequest('/patients/profile')
        .then(data => {
            const profileContainer = document.getElementById('profile-container');
            if (profileContainer) {
                const profileHtml = `
                    <div class="d-flex align-items-center profile-header">
                        <div class="profile-avatar">
                            <i class="bi bi-person"></i>
                        </div>
                        <div class="profile-info">
                            <h4>${data.name}</h4>
                            <p><i class="bi bi-envelope"></i> ${data.email}</p>
                            <p><i class="bi bi-telephone"></i> ${data.phone || 'Not provided'}</p>
                            <p><i class="bi bi-calendar"></i> Patient since ${formatDate(data.created_at)}</p>
                        </div>
                    </div>
                `;
                
                profileContainer.innerHTML = profileHtml;
            }
            
            // Update patient stats if the element exists
            updatePatientStats(data.stats);
        })
        .catch(error => {
            console.error('Error loading patient profile:', error);
        })
        .finally(() => {
            toggleContentLoading('profile-container', false);
        });
}

// Update patient statistics
function updatePatientStats(stats) {
    if (!stats) return;
    
    const statsContainer = document.getElementById('patient-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="card stat-card">
                        <div class="card-body d-flex align-items-center">
                            <div class="me-3 stat-icon">
                                <i class="bi bi-calendar-check"></i>
                            </div>
                            <div>
                                <p class="stat-value">${stats.total_appointments || 0}</p>
                                <p class="stat-label">Total Appointments</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card stat-card urgent">
                        <div class="card-body d-flex align-items-center">
                            <div class="me-3 stat-icon">
                                <i class="bi bi-calendar-x"></i>
                            </div>
                            <div>
                                <p class="stat-value">${stats.upcoming_appointments || 0}</p>
                                <p class="stat-label">Upcoming Appointments</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card stat-card success">
                        <div class="card-body d-flex align-items-center">
                            <div class="me-3 stat-icon">
                                <i class="bi bi-file-medical"></i>
                            </div>
                            <div>
                                <p class="stat-value">${stats.medical_records || 0}</p>
                                <p class="stat-label">Medical Records</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Load patient appointments
function loadPatientAppointments() {
    toggleContentLoading('appointments-table-container', true);
    
    makeApiRequest('/appointments/patient')
        .then(data => {
            const tableContainer = document.getElementById('appointments-table-container');
            if (!tableContainer) return;
            
            if (data.appointments && data.appointments.length > 0) {
                let tableHtml = `
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Doctor</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.appointments.forEach(appointment => {
                    const statusClass = getStatusBadgeClass(appointment.status);
                    
                    tableHtml += `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="ms-2">
                                        <p class="fw-bold mb-0">Dr. ${appointment.doctor_name}</p>
                                        <p class="text-muted mb-0">${appointment.specialization}</p>
                                    </div>
                                </div>
                            </td>
                            <td>${formatDate(appointment.appointment_time)}</td>
                            <td><span class="badge ${statusClass}">${appointment.status}</span></td>
                            <td>
                                ${appointment.status === 'pending' || appointment.status === 'confirmed' ? 
                                `<button class="btn btn-sm btn-outline-danger cancel-appointment-btn" data-id="${appointment.id}">Cancel</button>` : ''}
                                <button class="btn btn-sm btn-outline-primary view-appointment-btn" data-id="${appointment.id}">View</button>
                            </td>
                        </tr>
                    `;
                });
                
                tableHtml += `
                        </tbody>
                    </table>
                `;
                
                tableContainer.innerHTML = tableHtml;
                
                // Add event listeners for action buttons
                const cancelButtons = document.querySelectorAll('.cancel-appointment-btn');
                cancelButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const appointmentId = this.getAttribute('data-id');
                        cancelAppointment(appointmentId);
                    });
                });
                
                const viewButtons = document.querySelectorAll('.view-appointment-btn');
                viewButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const appointmentId = this.getAttribute('data-id');
                        viewAppointmentDetails(appointmentId);
                    });
                });
            } else {
                tableContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        You don't have any appointments yet. You can book an appointment from the "Book Appointment" tab.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading patient appointments:', error);
        })
        .finally(() => {
            toggleContentLoading('appointments-table-container', false);
        });
}

// Load available doctors for booking
function loadAvailableDoctors() {
    toggleContentLoading('doctors-list-container', true);
    
    makeApiRequest('/doctors/available')
        .then(data => {
            const doctorsContainer = document.getElementById('doctors-list-container');
            if (!doctorsContainer) return;
            
            if (data.doctors && data.doctors.length > 0) {
                let doctorsHtml = '<div class="row">';
                
                data.doctors.forEach(doctor => {
                    doctorsHtml += `
                        <div class="col-md-6 col-lg-4 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="me-3" style="width: 60px; height: 60px; background-color: var(--light-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                            <i class="bi bi-person-badge" style="font-size: 1.5rem; color: var(--primary-blue);"></i>
                                        </div>
                                        <div>
                                            <h5 class="card-title mb-0">Dr. ${doctor.name}</h5>
                                            <p class="text-muted mb-0">${doctor.specialization}</p>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <p class="mb-1"><i class="bi bi-star-fill text-warning me-1"></i> Rating: ${doctor.rating || '4.5'}/5</p>
                                        <p class="mb-1"><i class="bi bi-calendar-check me-1"></i> Available: ${doctor.available_days || 'Mon-Fri'}</p>
                                        <p class="mb-0"><i class="bi bi-clock me-1"></i> Hours: ${doctor.available_hours || '9:00 AM - 5:00 PM'}</p>
                                    </div>
                                    <button class="btn btn-primary w-100 book-with-doctor" data-id="${doctor.id}" data-name="${doctor.name}" data-specialization="${doctor.specialization}">
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                doctorsHtml += '</div>';
                doctorsContainer.innerHTML = doctorsHtml;
                
                // Add event listeners for booking buttons
                const bookButtons = document.querySelectorAll('.book-with-doctor');
                bookButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const doctorId = this.getAttribute('data-id');
                        const doctorName = this.getAttribute('data-name');
                        const specialization = this.getAttribute('data-specialization');
                        
                        // Fill the booking form with doctor info
                        document.getElementById('doctor-id').value = doctorId;
                        document.getElementById('doctor-name').value = `Dr. ${doctorName}`;
                        document.getElementById('doctor-specialization').value = specialization;
                        
                        // Switch to the booking form tab
                        const bookingTab = document.querySelector('a[href="#booking-form"]');
                        if (bookingTab) {
                            const tab = new bootstrap.Tab(bookingTab);
                            tab.show();
                        }
                        
                        // Scroll to the booking form
                        document.getElementById('booking-form-container').scrollIntoView({
                            behavior: 'smooth'
                        });
                    });
                });
            } else {
                doctorsContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No doctors are available at the moment. Please check back later.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading available doctors:', error);
        })
        .finally(() => {
            toggleContentLoading('doctors-list-container', false);
        });
}

// Setup appointment booking form
function setupAppointmentForm() {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;
    
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const doctorId = document.getElementById('doctor-id').value;
        const appointmentDate = document.getElementById('appointment-date').value;
        const appointmentTime = document.getElementById('appointment-time').value;
        const reason = document.getElementById('appointment-reason').value;
        const urgency = document.getElementById('appointment-urgency').value;
        
        // Validate form
        if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
            displayError('Please fill in all required fields');
            return;
        }
        
        // Combine date and time
        const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;
        
        // Create appointment data
        const appointmentData = {
            doctor_id: doctorId,
            appointment_time: appointmentDateTime,
            reason: reason,
            urgency: urgency
        };
        
        // Send appointment request
        toggleContentLoading('booking-form-container', true);
        
        makeApiRequest('/appointments/book', 'POST', appointmentData)
            .then(response => {
                // Clear form
                bookingForm.reset();
                
                // Show success message
                const successAlert = document.createElement('div');
                successAlert.className = 'alert alert-success alert-dismissible fade show';
                successAlert.setAttribute('role', 'alert');
                successAlert.innerHTML = `
                    <i class="bi bi-check-circle me-2"></i>
                    Appointment booked successfully! Your appointment ID is ${response.appointment_id}.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                
                const formContainer = document.getElementById('booking-form-container');
                formContainer.insertBefore(successAlert, bookingForm);
                
                // Switch to appointments tab
                const appointmentsTab = document.querySelector('a[href="#appointments"]');
                if (appointmentsTab) {
                    setTimeout(() => {
                        const tab = new bootstrap.Tab(appointmentsTab);
                        tab.show();
                        
                        // Reload appointments
                        loadPatientAppointments();
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Error booking appointment:', error);
            })
            .finally(() => {
                toggleContentLoading('booking-form-container', false);
            });
    });
}

// Cancel an appointment
function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        toggleContentLoading('appointments-table-container', true);
        
        makeApiRequest(`/appointments/cancel/${appointmentId}`, 'POST')
            .then(response => {
                displayError('Appointment cancelled successfully');
                loadPatientAppointments();
            })
            .catch(error => {
                console.error('Error cancelling appointment:', error);
            })
            .finally(() => {
                toggleContentLoading('appointments-table-container', false);
            });
    }
}

// View appointment details
function viewAppointmentDetails(appointmentId) {
    toggleContentLoading('main-content', true);
    
    makeApiRequest(`/appointments/${appointmentId}`)
        .then(data => {
            // Create modal for appointment details
            const modalHtml = `
                <div class="modal fade" id="appointmentDetailsModal" tabindex="-1" aria-labelledby="appointmentDetailsModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="appointmentDetailsModalLabel">Appointment Details</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <p class="text-muted mb-1">Appointment ID</p>
                                        <p class="fw-bold">${data.id}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p class="text-muted mb-1">Status</p>
                                        <span class="badge ${getStatusBadgeClass(data.status)}">${data.status}</span>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <p class="text-muted mb-1">Doctor</p>
                                        <p class="fw-bold">Dr. ${data.doctor_name}</p>
                                        <p>${data.specialization}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p class="text-muted mb-1">Date & Time</p>
                                        <p class="fw-bold">${formatDate(data.appointment_time)}</p>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <p class="text-muted mb-1">Reason for Visit</p>
                                    <p>${data.reason}</p>
                                </div>
                                <div class="mb-3">
                                    <p class="text-muted mb-1">Urgency Level</p>
                                    <p>${data.urgency}</p>
                                </div>
                                ${data.doctor_notes ? `
                                <div class="mb-3">
                                    <p class="text-muted mb-1">Doctor's Notes</p>
                                    <div class="p-3 bg-light rounded">
                                        ${data.doctor_notes}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                ${data.status === 'pending' || data.status === 'confirmed' ? `
                                <button type="button" class="btn btn-danger" id="modal-cancel-btn" data-id="${data.id}">Cancel Appointment</button>
                                ` : ''}
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to the page
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('appointmentDetailsModal'));
            modal.show();
            
            // Add event listener for cancel button
            const cancelBtn = document.getElementById('modal-cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    modal.hide();
                    // Remove modal from DOM after hiding
                    document.getElementById('appointmentDetailsModal').addEventListener('hidden.bs.modal', function() {
                        document.body.removeChild(modalContainer);
                    });
                    cancelAppointment(appointmentId);
                });
            }
            
            // Remove modal from DOM when closed
            document.getElementById('appointmentDetailsModal').addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modalContainer);
            });
        })
        .catch(error => {
            console.error('Error loading appointment details:', error);
        })
        .finally(() => {
            toggleContentLoading('main-content', false);
        });
}

// Load medical history
function loadMedicalHistory() {
    toggleContentLoading('medical-history-container', true);
    
    makeApiRequest('/patients/medical-history')
        .then(data => {
            const historyContainer = document.getElementById('medical-history-container');
            if (!historyContainer) return;
            
            if (data.records && data.records.length > 0) {
                let historyHtml = '';
                
                data.records.forEach(record => {
                    historyHtml += `
                        <div class="card mb-3">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <span>
                                    <i class="bi bi-calendar-date me-2"></i>
                                    ${formatDate(record.date)}
                                </span>
                                <span class="badge bg-info">${record.type}</span>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${record.diagnosis}</h5>
                                <p class="card-text">${record.description}</p>
                                <div class="mt-3">
                                    <p class="mb-1"><strong>Doctor:</strong> Dr. ${record.doctor_name}</p>
                                    <p class="mb-1"><strong>Prescription:</strong> ${record.prescription || 'None'}</p>
                                    <p class="mb-0"><strong>Instructions:</strong> ${record.instructions || 'None'}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                historyContainer.innerHTML = historyHtml;
            } else {
                historyContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No medical records found.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading medical history:', error);
        })
        .finally(() => {
            toggleContentLoading('medical-history-container', false);
        });
}

// Helper function to toggle loading state of a container
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

// Helper function to get the appropriate badge class based on status
function getStatusBadgeClass(status) {
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
