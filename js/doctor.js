// Initialize Doctor Dashboard
function initDoctorDashboard() {
    console.log('Initializing doctor dashboard');
    
    // Load doctor profile
    loadDoctorProfile();
    
    // Load appointments
    loadDoctorAppointments();
    
    // Load patients list
    loadDoctorPatients();
    
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
                    loadDoctorAppointments();
                } else if (targetId === '#patients') {
                    loadDoctorPatients();
                } else if (targetId === '#availability') {
                    loadDoctorAvailability();
                }
            });
        });
    }

    // Setup search functionality for patients
    const searchInput = document.getElementById('patient-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            searchPatients(searchTerm);
        });
    }
}

// Load doctor profile information
function loadDoctorProfile() {
    toggleContentLoading('profile-container', true);
    
    makeApiRequest('/doctors/profile')
        .then(data => {
            const profileContainer = document.getElementById('profile-container');
            if (profileContainer) {
                const profileHtml = `
                    <div class="d-flex align-items-center profile-header">
                        <div class="profile-avatar">
                            <i class="bi bi-person-badge"></i>
                        </div>
                        <div class="profile-info">
                            <h4>Dr. ${data.name}</h4>
                            <p><i class="bi bi-briefcase-fill me-2"></i>${data.specialization}</p>
                            <p><i class="bi bi-envelope me-2"></i>${data.email}</p>
                            <p><i class="bi bi-telephone me-2"></i>${data.phone || 'Not provided'}</p>
                        </div>
                    </div>
                `;
                
                profileContainer.innerHTML = profileHtml;
            }
            
            // Update doctor stats if the element exists
            updateDoctorStats(data.stats);
        })
        .catch(error => {
            console.error('Error loading doctor profile:', error);
        })
        .finally(() => {
            toggleContentLoading('profile-container', false);
        });
}

// Update doctor statistics
function updateDoctorStats(stats) {
    if (!stats) return;
    
    const statsContainer = document.getElementById('doctor-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-3 mb-3">
                    <div class="card stat-card">
                        <div class="card-body d-flex align-items-center">
                            <div class="me-3 stat-icon">
                                <i class="bi bi-calendar-check"></i>
                            </div>
                            <div>
                                <p class="stat-value">${stats.today_appointments || 0}</p>
                                <p class="stat-label">Today's Appointments</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card stat-card urgent">
                        <div class="card-body d-flex align-items-center">
                            <div class="me-3 stat-icon">
                                <i class="bi bi-exclamation-triangle"></i>
                            </div>
                            <div>
                                <p class="stat-value">${stats.urgent_cases || 0}</p>
                                <p class="stat-label">Urgent Cases</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card stat-card success">
                        <div class="card-body d-flex align-items-center">
                            <div class="me-3 stat-icon">
                                <i class="bi bi-people"></i>
                            </div>
                            <div>
                                <p class="stat-value">${stats.total_patients || 0}</p>
                                <p class="stat-label">Total Patients</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card stat-card warning">
                        <div class="card-body d-flex align-items-center">
                            <div class="me-3 stat-icon">
                                <i class="bi bi-star"></i>
                            </div>
                            <div>
                                <p class="stat-value">${stats.rating || '4.5'}</p>
                                <p class="stat-label">Rating</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Load doctor appointments
function loadDoctorAppointments() {
    toggleContentLoading('appointments-table-container', true);
    
    makeApiRequest('/appointments/doctor')
        .then(data => {
            const tableContainer = document.getElementById('appointments-table-container');
            if (!tableContainer) return;
            
            if (data.appointments && data.appointments.length > 0) {
                let tableHtml = `
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Date & Time</th>
                                <th>Reason</th>
                                <th>Urgency</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.appointments.forEach(appointment => {
                    const statusClass = getStatusBadgeClass(appointment.status);
                    const urgencyClass = getUrgencyBadgeClass(appointment.urgency);
                    
                    tableHtml += `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div>
                                        <p class="fw-bold mb-0">${appointment.patient_name}</p>
                                    </div>
                                </div>
                            </td>
                            <td>${formatDate(appointment.appointment_time)}</td>
                            <td>${appointment.reason.substring(0, 30)}${appointment.reason.length > 30 ? '...' : ''}</td>
                            <td><span class="badge ${urgencyClass}">${appointment.urgency}</span></td>
                            <td><span class="badge ${statusClass}">${appointment.status}</span></td>
                            <td>
                                ${appointment.status === 'pending' ? 
                                `<button class="btn btn-sm btn-success confirm-appointment-btn me-1" data-id="${appointment.id}">Confirm</button>` : ''}
                                ${appointment.status === 'confirmed' ? 
                                `<button class="btn btn-sm btn-primary complete-appointment-btn me-1" data-id="${appointment.id}">Complete</button>` : ''}
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
                const confirmButtons = document.querySelectorAll('.confirm-appointment-btn');
                confirmButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const appointmentId = this.getAttribute('data-id');
                        updateAppointmentStatus(appointmentId, 'confirmed');
                    });
                });
                
                const completeButtons = document.querySelectorAll('.complete-appointment-btn');
                completeButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const appointmentId = this.getAttribute('data-id');
                        completeAppointment(appointmentId);
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
                        You don't have any appointments scheduled.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading doctor appointments:', error);
        })
        .finally(() => {
            toggleContentLoading('appointments-table-container', false);
        });
}

// Load doctor's patients
function loadDoctorPatients() {
    toggleContentLoading('patients-list-container', true);
    
    makeApiRequest('/doctors/patients')
        .then(data => {
            const patientsContainer = document.getElementById('patients-list-container');
            if (!patientsContainer) return;
            
            if (data.patients && data.patients.length > 0) {
                let patientsHtml = `
                    <div class="row" id="patients-grid">
                `;
                
                data.patients.forEach(patient => {
                    patientsHtml += `
                        <div class="col-md-6 col-lg-4 mb-4 patient-card">
                            <div class="card h-100">
                                <div class="card-body">
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="me-3" style="width: 60px; height: 60px; background-color: var(--light-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                            <i class="bi bi-person" style="font-size: 1.5rem; color: var(--primary-blue);"></i>
                                        </div>
                                        <div>
                                            <h5 class="card-title mb-0">${patient.name}</h5>
                                            <p class="text-muted mb-0">ID: ${patient.id}</p>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <p class="mb-1"><i class="bi bi-calendar-check me-1"></i> Last Visit: ${formatDate(patient.last_visit)}</p>
                                        <p class="mb-1"><i class="bi bi-file-medical me-1"></i> Records: ${patient.record_count}</p>
                                        <p class="mb-0"><i class="bi bi-telephone me-1"></i> Contact: ${patient.phone || 'Not provided'}</p>
                                    </div>
                                    <div class="d-flex">
                                        <button class="btn btn-outline-primary me-2 view-patient-btn" data-id="${patient.id}">
                                            View Records
                                        </button>
                                        <button class="btn btn-primary add-record-btn" data-id="${patient.id}" data-name="${patient.name}">
                                            Add Record
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                patientsHtml += '</div>';
                patientsContainer.innerHTML = patientsHtml;
                
                // Add event listeners for buttons
                const viewButtons = document.querySelectorAll('.view-patient-btn');
                viewButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const patientId = this.getAttribute('data-id');
                        viewPatientRecords(patientId);
                    });
                });
                
                const addRecordButtons = document.querySelectorAll('.add-record-btn');
                addRecordButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const patientId = this.getAttribute('data-id');
                        const patientName = this.getAttribute('data-name');
                        showAddRecordModal(patientId, patientName);
                    });
                });
            } else {
                patientsContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        You don't have any patients assigned to you yet.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading doctor patients:', error);
        })
        .finally(() => {
            toggleContentLoading('patients-list-container', false);
        });
}

// Load doctor availability settings
function loadDoctorAvailability() {
    toggleContentLoading('availability-container', true);
    
    makeApiRequest('/doctors/availability')
        .then(data => {
            const availabilityContainer = document.getElementById('availability-container');
            if (!availabilityContainer) return;
            
            let availabilityHtml = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Manage Your Availability</h5>
                    </div>
                    <div class="card-body">
                        <form id="availability-form">
                            <div class="mb-4">
                                <h6>Working Days</h6>
                                <div class="row">
            `;
            
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            days.forEach(day => {
                const isChecked = data.availability && data.availability.working_days.includes(day) ? 'checked' : '';
                
                availabilityHtml += `
                    <div class="col-md-4 col-lg-3 mb-2">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${day}" id="day-${day.toLowerCase()}" name="working_days" ${isChecked}>
                            <label class="form-check-label" for="day-${day.toLowerCase()}">
                                ${day}
                            </label>
                        </div>
                    </div>
                `;
            });
            
            availabilityHtml += `
                                </div>
                            </div>
                            
                            <div class="row mb-4">
                                <div class="col-md-6 mb-3">
                                    <h6>Working Hours</h6>
                                    <div class="row g-3">
                                        <div class="col-6">
                                            <label for="start-time" class="form-label">Start Time</label>
                                            <input type="time" class="form-control" id="start-time" name="start_time" value="${data.availability ? data.availability.start_time : '09:00'}">
                                        </div>
                                        <div class="col-6">
                                            <label for="end-time" class="form-label">End Time</label>
                                            <input type="time" class="form-control" id="end-time" name="end_time" value="${data.availability ? data.availability.end_time : '17:00'}">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <h6>Appointment Duration</h6>
                                    <div class="row g-3">
                                        <div class="col-12">
                                            <label for="appointment-duration" class="form-label">Minutes per appointment</label>
                                            <select class="form-select" id="appointment-duration" name="appointment_duration">
                                                <option value="15" ${data.availability && data.availability.appointment_duration === 15 ? 'selected' : ''}>15 minutes</option>
                                                <option value="30" ${data.availability && data.availability.appointment_duration === 30 ? 'selected' : ''}>30 minutes</option>
                                                <option value="45" ${data.availability && data.availability.appointment_duration === 45 ? 'selected' : ''}>45 minutes</option>
                                                <option value="60" ${data.availability && data.availability.appointment_duration === 60 ? 'selected' : ''}>60 minutes</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h6>Time Off</h6>
                                <div id="time-off-container">
            `;
            
            if (data.availability && data.availability.time_off && data.availability.time_off.length > 0) {
                data.availability.time_off.forEach((timeOff, index) => {
                    availabilityHtml += `
                        <div class="row mb-3 time-off-row">
                            <div class="col-md-5">
                                <label class="form-label">Start Date</label>
                                <input type="date" class="form-control" name="time_off_start" value="${timeOff.start_date}">
                            </div>
                            <div class="col-md-5">
                                <label class="form-label">End Date</label>
                                <input type="date" class="form-control" name="time_off_end" value="${timeOff.end_date}">
                            </div>
                            <div class="col-md-2 d-flex align-items-end">
                                <button type="button" class="btn btn-outline-danger remove-time-off">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            } else {
                availabilityHtml += `
                    <div class="row mb-3 time-off-row">
                        <div class="col-md-5">
                            <label class="form-label">Start Date</label>
                            <input type="date" class="form-control" name="time_off_start">
                        </div>
                        <div class="col-md-5">
                            <label class="form-label">End Date</label>
                            <input type="date" class="form-control" name="time_off_end">
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button type="button" class="btn btn-outline-danger remove-time-off">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            availabilityHtml += `
                                </div>
                                <button type="button" class="btn btn-outline-primary" id="add-time-off">
                                    <i class="bi bi-plus-circle me-1"></i> Add Time Off
                                </button>
                            </div>
                            
                            <div class="text-end">
                                <button type="submit" class="btn btn-primary">Save Availability</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            availabilityContainer.innerHTML = availabilityHtml;
            
            // Setup form event listeners
            setupAvailabilityFormListeners();
        })
        .catch(error => {
            console.error('Error loading doctor availability:', error);
        })
        .finally(() => {
            toggleContentLoading('availability-container', false);
        });
}

// Setup availability form event listeners
function setupAvailabilityFormListeners() {
    const form = document.getElementById('availability-form');
    const addTimeOffBtn = document.getElementById('add-time-off');
    
    if (addTimeOffBtn) {
        addTimeOffBtn.addEventListener('click', function() {
            const timeOffContainer = document.getElementById('time-off-container');
            const newRow = document.createElement('div');
            newRow.className = 'row mb-3 time-off-row';
            newRow.innerHTML = `
                <div class="col-md-5">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-control" name="time_off_start">
                </div>
                <div class="col-md-5">
                    <label class="form-label">End Date</label>
                    <input type="date" class="form-control" name="time_off_end">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger remove-time-off">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            
            timeOffContainer.appendChild(newRow);
            
            // Add event listener to the new remove button
            const removeBtn = newRow.querySelector('.remove-time-off');
            removeBtn.addEventListener('click', function() {
                newRow.remove();
            });
        });
    }
    
    // Add event listeners to existing remove buttons
    const removeButtons = document.querySelectorAll('.remove-time-off');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.time-off-row').remove();
        });
    });
    
    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect working days
            const workingDays = [];
            const workingDaysCheckboxes = document.querySelectorAll('input[name="working_days"]:checked');
            workingDaysCheckboxes.forEach(checkbox => {
                workingDays.push(checkbox.value);
            });
            
            // Collect time off periods
            const timeOff = [];
            const timeOffRows = document.querySelectorAll('.time-off-row');
            timeOffRows.forEach(row => {
                const startDateInput = row.querySelector('input[name="time_off_start"]');
                const endDateInput = row.querySelector('input[name="time_off_end"]');
                
                if (startDateInput.value && endDateInput.value) {
                    timeOff.push({
                        start_date: startDateInput.value,
                        end_date: endDateInput.value
                    });
                }
            });
            
            // Prepare availability data
            const availabilityData = {
                working_days: workingDays,
                start_time: document.getElementById('start-time').value,
                end_time: document.getElementById('end-time').value,
                appointment_duration: parseInt(document.getElementById('appointment-duration').value),
                time_off: timeOff
            };
            
            // Save availability
            toggleContentLoading('availability-container', true);
            
            makeApiRequest('/doctors/availability', 'POST', availabilityData)
                .then(response => {
                    // Show success message
                    const successAlert = document.createElement('div');
                    successAlert.className = 'alert alert-success alert-dismissible fade show';
                    successAlert.setAttribute('role', 'alert');
                    successAlert.innerHTML = `
                        <i class="bi bi-check-circle me-2"></i>
                        Availability settings saved successfully!
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    `;
                    
                    const availabilityContainer = document.getElementById('availability-container');
                    availabilityContainer.insertBefore(successAlert, availabilityContainer.firstChild);
                })
                .catch(error => {
                    console.error('Error saving availability:', error);
                })
                .finally(() => {
                    toggleContentLoading('availability-container', false);
                });
        });
    }
}

// Update appointment status
function updateAppointmentStatus(appointmentId, status) {
    toggleContentLoading('appointments-table-container', true);
    
    makeApiRequest(`/appointments/update/${appointmentId}`, 'POST', { status: status })
        .then(response => {
            displayError(`Appointment ${status} successfully`);
            loadDoctorAppointments();
        })
        .catch(error => {
            console.error(`Error updating appointment to ${status}:`, error);
        })
        .finally(() => {
            toggleContentLoading('appointments-table-container', false);
        });
}

// Complete appointment and add notes
function completeAppointment(appointmentId) {
    // Create a modal for adding notes
    const modalHtml = `
        <div class="modal fade" id="completeAppointmentModal" tabindex="-1" aria-labelledby="completeAppointmentModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="completeAppointmentModalLabel">Complete Appointment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="complete-appointment-form">
                            <div class="mb-3">
                                <label for="doctor-notes" class="form-label">Doctor's Notes</label>
                                <textarea class="form-control" id="doctor-notes" rows="5" placeholder="Enter your notes about the appointment..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="submit-complete-appointment">Complete Appointment</button>
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
    const modal = new bootstrap.Modal(document.getElementById('completeAppointmentModal'));
    modal.show();
    
    // Add event listener for complete button
    const completeBtn = document.getElementById('submit-complete-appointment');
    if (completeBtn) {
        completeBtn.addEventListener('click', function() {
            const notes = document.getElementById('doctor-notes').value;
            
            // Submit completion request
            toggleContentLoading('appointments-table-container', true);
            
            makeApiRequest(`/appointments/complete/${appointmentId}`, 'POST', { doctor_notes: notes })
                .then(response => {
                    modal.hide();
                    // Remove modal from DOM after hiding
                    document.getElementById('completeAppointmentModal').addEventListener('hidden.bs.modal', function() {
                        document.body.removeChild(modalContainer);
                    });
                    
                    displayError('Appointment completed successfully');
                    loadDoctorAppointments();
                })
                .catch(error => {
                    console.error('Error completing appointment:', error);
                })
                .finally(() => {
                    toggleContentLoading('appointments-table-container', false);
                });
        });
    }
    
    // Remove modal from DOM when closed
    document.getElementById('completeAppointmentModal').addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalContainer);
    });
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
                                        <p class="text-muted mb-1">Patient</p>
                                        <p class="fw-bold">${data.patient_name}</p>
                                        <p>ID: ${data.patient_id}</p>
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
                                    <p><span class="badge ${getUrgencyBadgeClass(data.urgency)}">${data.urgency}</span></p>
                                </div>
                                ${data.doctor_notes ? `
                                <div class="mb-3">
                                    <p class="text-muted mb-1">Doctor's Notes</p>
                                    <div class="p-3 bg-light rounded">
                                        ${data.doctor_notes}
                                    </div>
                                </div>
                                ` : ''}
                                
                                ${data.status === 'pending' || data.status === 'confirmed' ? `
                                <div class="mt-4 pt-3 border-top">
                                    <h6>Update Appointment</h6>
                                    ${data.status === 'pending' ? `
                                    <button type="button" class="btn btn-success me-2" id="modal-confirm-btn" data-id="${data.id}">
                                        <i class="bi bi-check-circle me-1"></i> Confirm Appointment
                                    </button>
                                    ` : ''}
                                    ${data.status === 'confirmed' ? `
                                    <button type="button" class="btn btn-primary me-2" id="modal-complete-btn" data-id="${data.id}">
                                        <i class="bi bi-journal-check me-1"></i> Complete Appointment
                                    </button>
                                    ` : ''}
                                    <button type="button" class="btn btn-danger" id="modal-cancel-btn" data-id="${data.id}">
                                        <i class="bi bi-x-circle me-1"></i> Cancel Appointment
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
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
            
            // Add event listeners for action buttons
            const confirmBtn = document.getElementById('modal-confirm-btn');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    modal.hide();
                    updateAppointmentStatus(appointmentId, 'confirmed');
                });
            }
            
            const completeBtn = document.getElementById('modal-complete-btn');
            if (completeBtn) {
                completeBtn.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    modal.hide();
                    completeAppointment(appointmentId);
                });
            }
            
            const cancelBtn = document.getElementById('modal-cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    if (confirm('Are you sure you want to cancel this appointment?')) {
                        modal.hide();
                        updateAppointmentStatus(appointmentId, 'cancelled');
                    }
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

// View patient medical records
function viewPatientRecords(patientId) {
    toggleContentLoading('main-content', true);
    
    makeApiRequest(`/patients/${patientId}/records`)
        .then(data => {
            // Create modal for patient records
            let modalHtml = `
                <div class="modal fade" id="patientRecordsModal" tabindex="-1" aria-labelledby="patientRecordsModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="patientRecordsModalLabel">Medical Records: ${data.patient_name}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="d-flex justify-content-between align-items-center mb-4">
                                    <h6>Patient Information</h6>
                                    <button class="btn btn-primary btn-sm" id="add-record-modal-btn" data-id="${patientId}" data-name="${data.patient_name}">
                                        <i class="bi bi-plus-circle me-1"></i> Add New Record
                                    </button>
                                </div>
                                
                                <div class="card mb-4">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <p class="mb-1"><strong>Name:</strong> ${data.patient_name}</p>
                                                <p class="mb-1"><strong>Patient ID:</strong> ${patientId}</p>
                                            </div>
                                            <div class="col-md-6">
                                                <p class="mb-1"><strong>Date of Birth:</strong> ${data.date_of_birth || 'Not available'}</p>
                                                <p class="mb-1"><strong>Contact:</strong> ${data.phone || 'Not available'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <h6 class="mb-3">Medical Records</h6>
            `;
            
            if (data.records && data.records.length > 0) {
                data.records.forEach(record => {
                    modalHtml += `
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
            } else {
                modalHtml += `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No medical records found for this patient.
                    </div>
                `;
            }
            
            modalHtml += `
                            </div>
                            <div class="modal-footer">
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
            const modal = new bootstrap.Modal(document.getElementById('patientRecordsModal'));
            modal.show();
            
            // Add event listener for add record button
            const addRecordBtn = document.getElementById('add-record-modal-btn');
            if (addRecordBtn) {
                addRecordBtn.addEventListener('click', function() {
                    const patientId = this.getAttribute('data-id');
                    const patientName = this.getAttribute('data-name');
                    modal.hide();
                    showAddRecordModal(patientId, patientName);
                });
            }
            
            // Remove modal from DOM when closed
            document.getElementById('patientRecordsModal').addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modalContainer);
            });
        })
        .catch(error => {
            console.error('Error loading patient records:', error);
        })
        .finally(() => {
            toggleContentLoading('main-content', false);
        });
}

// Show modal to add a medical record
function showAddRecordModal(patientId, patientName) {
    // Create modal for adding a record
    const modalHtml = `
        <div class="modal fade" id="addRecordModal" tabindex="-1" aria-labelledby="addRecordModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addRecordModalLabel">Add Medical Record for ${patientName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-record-form">
                            <input type="hidden" id="record-patient-id" value="${patientId}">
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="record-date" class="form-label">Date</label>
                                    <input type="date" class="form-control" id="record-date" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                <div class="col-md-6">
                                    <label for="record-type" class="form-label">Record Type</label>
                                    <select class="form-select" id="record-type" required>
                                        <option value="Consultation">Consultation</option>
                                        <option value="Examination">Examination</option>
                                        <option value="Procedure">Procedure</option>
                                        <option value="Lab Test">Lab Test</option>
                                        <option value="Surgery">Surgery</option>
                                        <option value="Follow-up">Follow-up</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="record-diagnosis" class="form-label">Diagnosis</label>
                                <input type="text" class="form-control" id="record-diagnosis" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="record-description" class="form-label">Description</label>
                                <textarea class="form-control" id="record-description" rows="4" required></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label for="record-prescription" class="form-label">Prescription</label>
                                <textarea class="form-control" id="record-prescription" rows="3"></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label for="record-instructions" class="form-label">Instructions</label>
                                <textarea class="form-control" id="record-instructions" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="submit-record">Save Record</button>
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
    const modal = new bootstrap.Modal(document.getElementById('addRecordModal'));
    modal.show();
    
    // Add event listener for save button
    const saveBtn = document.getElementById('submit-record');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const form = document.getElementById('add-record-form');
            
            // Form validation
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const recordData = {
                patient_id: document.getElementById('record-patient-id').value,
                date: document.getElementById('record-date').value,
                type: document.getElementById('record-type').value,
                diagnosis: document.getElementById('record-diagnosis').value,
                description: document.getElementById('record-description').value,
                prescription: document.getElementById('record-prescription').value,
                instructions: document.getElementById('record-instructions').value
            };
            
            // Submit record
            toggleContentLoading('main-content', true);
            
            makeApiRequest('/patients/add-record', 'POST', recordData)
                .then(response => {
                    modal.hide();
                    // Remove modal from DOM after hiding
                    document.getElementById('addRecordModal').addEventListener('hidden.bs.modal', function() {
                        document.body.removeChild(modalContainer);
                    });
                    
                    displayError('Medical record added successfully');
                    
                    // Refresh patient list
                    loadDoctorPatients();
                })
                .catch(error => {
                    console.error('Error adding medical record:', error);
                })
                .finally(() => {
                    toggleContentLoading('main-content', false);
                });
        });
    }
    
    // Remove modal from DOM when closed
    document.getElementById('addRecordModal').addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalContainer);
    });
}

// Search patients
function searchPatients(searchTerm) {
    const patientCards = document.querySelectorAll('.patient-card');
    
    patientCards.forEach(card => {
        const name = card.querySelector('.card-title').textContent.toLowerCase();
        const id = card.querySelector('.text-muted').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || id.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
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

// Helper function to get the appropriate badge class based on urgency
function getUrgencyBadgeClass(urgency) {
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
