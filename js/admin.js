// Initialize Admin Dashboard
function initAdminDashboard() {
    console.log('Initializing admin dashboard');
    
    // Load admin profile
    loadAdminProfile();
    
    // Load system metrics
    loadSystemMetrics();
    
    // Load doctors list
    loadDoctorsList();
    
    // Setup tabs if they exist
    setupTabs();
    
    // Setup doctor form
    setupDoctorForm();
    
    // Setup report generation
    setupReportGeneration();
}

function setupTabs() {
    const tabEls = document.querySelectorAll('a[data-bs-toggle="tab"]');
    
    if (tabEls.length > 0) {
        tabEls.forEach(tabEl => {
            tabEl.addEventListener('shown.bs.tab', function (event) {
                const targetId = event.target.getAttribute('href');
                
                if (targetId === '#doctors') {
                    loadDoctorsList();
                } else if (targetId === '#patients') {
                    loadPatientsList();
                } else if (targetId === '#reports') {
                    loadReportsData();
                }
            });
        });
    }
    
    // Setup search functionality
    const doctorSearchInput = document.getElementById('doctor-search');
    if (doctorSearchInput) {
        doctorSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            searchDoctors(searchTerm);
        });
    }
    
    const patientSearchInput = document.getElementById('patient-search');
    if (patientSearchInput) {
        patientSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            searchPatients(searchTerm);
        });
    }
}

// Load admin profile information
function loadAdminProfile() {
    toggleContentLoading('profile-container', true);
    
    makeApiRequest('/admins/profile')
        .then(data => {
            const profileContainer = document.getElementById('profile-container');
            if (profileContainer) {
                const profileHtml = `
                    <div class="d-flex align-items-center profile-header">
                        <div class="profile-avatar">
                            <i class="bi bi-person-badge-fill"></i>
                        </div>
                        <div class="profile-info">
                            <h4>${data.name}</h4>
                            <p><i class="bi bi-envelope me-2"></i>${data.email}</p>
                            <p><i class="bi bi-shield-lock me-2"></i>Administrator</p>
                        </div>
                    </div>
                `;
                
                profileContainer.innerHTML = profileHtml;
            }
        })
        .catch(error => {
            console.error('Error loading admin profile:', error);
        })
        .finally(() => {
            toggleContentLoading('profile-container', false);
        });
}

// Load system metrics
function loadSystemMetrics() {
    toggleContentLoading('system-metrics-container', true);
    
    makeApiRequest('/admin/metrics')
        .then(data => {
            const metricsContainer = document.getElementById('system-metrics-container');
            if (metricsContainer) {
                metricsContainer.innerHTML = `
                    <div class="row">
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card">
                                <div class="card-body d-flex align-items-center">
                                    <div class="me-3 stat-icon">
                                        <i class="bi bi-person"></i>
                                    </div>
                                    <div>
                                        <p class="stat-value">${data.total_patients || 0}</p>
                                        <p class="stat-label">Total Patients</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card">
                                <div class="card-body d-flex align-items-center">
                                    <div class="me-3 stat-icon">
                                        <i class="bi bi-person-badge"></i>
                                    </div>
                                    <div>
                                        <p class="stat-value">${data.total_doctors || 0}</p>
                                        <p class="stat-label">Total Doctors</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card urgent">
                                <div class="card-body d-flex align-items-center">
                                    <div class="me-3 stat-icon">
                                        <i class="bi bi-calendar-check"></i>
                                    </div>
                                    <div>
                                        <p class="stat-value">${data.total_appointments || 0}</p>
                                        <p class="stat-label">Total Appointments</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card success">
                                <div class="card-body d-flex align-items-center">
                                    <div class="me-3 stat-icon">
                                        <i class="bi bi-check-circle"></i>
                                    </div>
                                    <div>
                                        <p class="stat-value">${data.completion_rate || '0'}%</p>
                                        <p class="stat-label">Completion Rate</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-header">
                                    <h5 class="mb-0">Appointments by Status</h5>
                                </div>
                                <div class="card-body">
                                    <div class="chart-container" style="position: relative; height:250px; width:100%">
                                        <canvas id="appointmentsChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-header">
                                    <h5 class="mb-0">Users by Role</h5>
                                </div>
                                <div class="card-body">
                                    <div class="chart-container" style="position: relative; height:250px; width:100%">
                                        <canvas id="usersChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Create charts
                createAppointmentsChart(data.appointments_by_status);
                createUsersChart(data.users_by_role);
            }
        })
        .catch(error => {
            console.error('Error loading system metrics:', error);
        })
        .finally(() => {
            toggleContentLoading('system-metrics-container', false);
        });
}

// Create appointments chart
function createAppointmentsChart(data) {
    const ctx = document.getElementById('appointmentsChart');
    if (!ctx) return;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    const backgroundColors = [
        'rgba(40, 167, 69, 0.7)',  // Completed - Green
        'rgba(0, 123, 255, 0.7)',   // Confirmed - Blue
        'rgba(255, 193, 7, 0.7)',   // Pending - Yellow
        'rgba(220, 53, 69, 0.7)'    // Cancelled - Red
    ];
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Create users chart
function createUsersChart(data) {
    const ctx = document.getElementById('usersChart');
    if (!ctx) return;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    const backgroundColors = [
        'rgba(0, 123, 255, 0.7)',   // Doctors - Blue
        'rgba(40, 167, 69, 0.7)',    // Patients - Green
        'rgba(108, 117, 125, 0.7)'   // Admins - Gray
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Load doctors list
function loadDoctorsList() {
    toggleContentLoading('doctors-list-container', true);
    
    makeApiRequest('/admin/doctors')
        .then(data => {
            const doctorsContainer = document.getElementById('doctors-list-container');
            if (!doctorsContainer) return;
            
            if (data.doctors && data.doctors.length > 0) {
                let doctorsHtml = `
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Specialization</th>
                                <th>Appointments</th>
                                <th>Rating</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.doctors.forEach(doctor => {
                    doctorsHtml += `
                        <tr class="doctor-row">
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="ms-2">
                                        <p class="fw-bold mb-0">Dr. ${doctor.name}</p>
                                        <p class="text-muted mb-0">${doctor.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td>${doctor.specialization}</td>
                            <td>${doctor.appointment_count || 0}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <span class="me-2">${doctor.rating || '4.5'}</span>
                                    <i class="bi bi-star-fill text-warning"></i>
                                </div>
                            </td>
                            <td><span class="badge ${doctor.active ? 'bg-success' : 'bg-danger'}">${doctor.active ? 'Active' : 'Inactive'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary view-doctor-btn me-1" data-id="${doctor.id}">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-warning edit-doctor-btn me-1" data-id="${doctor.id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger ${doctor.active ? 'deactivate-doctor-btn' : 'activate-doctor-btn'}" data-id="${doctor.id}">
                                    <i class="bi ${doctor.active ? 'bi-slash-circle' : 'bi-check-circle'}"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                doctorsHtml += `
                        </tbody>
                    </table>
                `;
                
                doctorsContainer.innerHTML = doctorsHtml;
                
                // Add event listeners
                const viewButtons = document.querySelectorAll('.view-doctor-btn');
                viewButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const doctorId = this.getAttribute('data-id');
                        viewDoctorDetails(doctorId);
                    });
                });
                
                const editButtons = document.querySelectorAll('.edit-doctor-btn');
                editButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const doctorId = this.getAttribute('data-id');
                        editDoctorDetails(doctorId);
                    });
                });
                
                const deactivateButtons = document.querySelectorAll('.deactivate-doctor-btn');
                deactivateButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const doctorId = this.getAttribute('data-id');
                        if (confirm("Are you sure you want to deactivate this doctor?")) {
                            toggleDoctorStatus(doctorId, false);
                        }
                    });
                });
                
                const activateButtons = document.querySelectorAll('.activate-doctor-btn');
                activateButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const doctorId = this.getAttribute('data-id');
                        if (confirm("Are you sure you want to activate this doctor?")) {
                            toggleDoctorStatus(doctorId, true);
                        }
                    });
                });
            } else {
                doctorsContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No doctors found in the system.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading doctors list:', error);
        })
        .finally(() => {
            toggleContentLoading('doctors-list-container', false);
        });
}

// Load patients list
function loadPatientsList() {
    toggleContentLoading('patients-list-container', true);
    
    makeApiRequest('/admin/patients')
        .then(data => {
            const patientsContainer = document.getElementById('patients-list-container');
            if (!patientsContainer) return;
            
            if (data.patients && data.patients.length > 0) {
                let patientsHtml = `
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Appointments</th>
                                <th>Medical Records</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.patients.forEach(patient => {
                    patientsHtml += `
                        <tr class="patient-row">
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="ms-2">
                                        <p class="fw-bold mb-0">${patient.name}</p>
                                        <p class="text-muted mb-0">ID: ${patient.id}</p>
                                    </div>
                                </div>
                            </td>
                            <td>${patient.email}</td>
                            <td>${patient.appointment_count || 0}</td>
                            <td>${patient.record_count || 0}</td>
                            <td><span class="badge ${patient.active ? 'bg-success' : 'bg-danger'}">${patient.active ? 'Active' : 'Inactive'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary view-patient-btn me-1" data-id="${patient.id}">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger ${patient.active ? 'deactivate-patient-btn' : 'activate-patient-btn'}" data-id="${patient.id}">
                                    <i class="bi ${patient.active ? 'bi-slash-circle' : 'bi-check-circle'}"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                patientsHtml += `
                        </tbody>
                    </table>
                `;
                
                patientsContainer.innerHTML = patientsHtml;
                
                // Add event listeners
                const viewButtons = document.querySelectorAll('.view-patient-btn');
                viewButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const patientId = this.getAttribute('data-id');
                        viewPatientDetails(patientId);
                    });
                });
                
                const deactivateButtons = document.querySelectorAll('.deactivate-patient-btn');
                deactivateButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const patientId = this.getAttribute('data-id');
                        if (confirm("Are you sure you want to deactivate this patient?")) {
                            togglePatientStatus(patientId, false);
                        }
                    });
                });
                
                const activateButtons = document.querySelectorAll('.activate-patient-btn');
                activateButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const patientId = this.getAttribute('data-id');
                        if (confirm("Are you sure you want to activate this patient?")) {
                            togglePatientStatus(patientId, true);
                        }
                    });
                });
            } else {
                patientsContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No patients found in the system.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading patients list:', error);
        })
        .finally(() => {
            toggleContentLoading('patients-list-container', false);
        });
}

// Setup doctor form
function setupDoctorForm() {
    const doctorForm = document.getElementById('doctor-form');
    if (!doctorForm) return;
    
    doctorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('doctor-name').value,
            email: document.getElementById('doctor-email').value,
            password: document.getElementById('doctor-password').value,
            specialization: document.getElementById('doctor-specialization').value,
            phone: document.getElementById('doctor-phone').value
        };
        
        // Validate form
        if (!formData.name || !formData.email || !formData.password || !formData.specialization) {
            displayError('Please fill in all required fields');
            return;
        }
        
        toggleContentLoading('doctor-form-container', true);
        
        makeApiRequest('/admin/add-doctor', 'POST', formData)
            .then(response => {
                // Show success message
                const successAlert = document.createElement('div');
                successAlert.className = 'alert alert-success alert-dismissible fade show';
                successAlert.setAttribute('role', 'alert');
                successAlert.innerHTML = `
                    <i class="bi bi-check-circle me-2"></i>
                    Doctor added successfully!
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                
                const formContainer = document.getElementById('doctor-form-container');
                formContainer.insertBefore(successAlert, doctorForm);
                
                // Clear form
                doctorForm.reset();
                
                // Reload doctors list
                loadDoctorsList();
                
                // Reload metrics
                loadSystemMetrics();
            })
            .catch(error => {
                console.error('Error adding doctor:', error);
            })
            .finally(() => {
                toggleContentLoading('doctor-form-container', false);
            });
    });
}

// Setup report generation
function setupReportGeneration() {
    const reportForm = document.getElementById('report-form');
    if (!reportForm) return;
    
    reportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const reportType = document.getElementById('report-type').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (!reportType || !startDate || !endDate) {
            displayError('Please fill in all report parameters');
            return;
        }
        
        // Check if start date is before end date
        if (new Date(startDate) > new Date(endDate)) {
            displayError('Start date must be before end date');
            return;
        }
        
        toggleContentLoading('report-container', true);
        
        makeApiRequest('/admin/generate-report', 'POST', {
            report_type: reportType,
            start_date: startDate,
            end_date: endDate
        })
            .then(data => {
                // Display report based on type
                if (reportType === 'appointment_summary') {
                    displayAppointmentSummaryReport(data, startDate, endDate);
                } else if (reportType === 'doctor_performance') {
                    displayDoctorPerformanceReport(data, startDate, endDate);
                } else if (reportType === 'patient_visits') {
                    displayPatientVisitsReport(data, startDate, endDate);
                }
            })
            .catch(error => {
                console.error('Error generating report:', error);
            })
            .finally(() => {
                toggleContentLoading('report-container', false);
            });
    });
}

// Display appointment summary report
function displayAppointmentSummaryReport(data, startDate, endDate) {
    const reportContainer = document.getElementById('report-result-container');
    if (!reportContainer) return;
    
    let reportHtml = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Appointment Summary Report</h5>
                <div>
                    <span class="badge bg-secondary">${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}</span>
                    <button class="btn btn-sm btn-outline-primary ms-2" id="print-report-btn">
                        <i class="bi bi-printer"></i> Print
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.total_appointments}</h3>
                            <p class="text-muted">Total Appointments</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.completed_appointments}</h3>
                            <p class="text-muted">Completed</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.cancelled_appointments}</h3>
                            <p class="text-muted">Cancelled</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.completion_percentage}%</h3>
                            <p class="text-muted">Completion Rate</p>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <h6 class="mb-3">Appointments by Status</h6>
                        <div class="chart-container" style="position: relative; height:250px; width:100%">
                            <canvas id="appointmentStatusChart"></canvas>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <h6 class="mb-3">Appointments by Day</h6>
                        <div class="chart-container" style="position: relative; height:250px; width:100%">
                            <canvas id="appointmentDayChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <h6 class="mb-3">Appointments by Department</h6>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Specialization</th>
                            <th>Appointments</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    data.by_specialization.forEach(spec => {
        reportHtml += `
            <tr>
                <td>${spec.specialization}</td>
                <td>${spec.count}</td>
                <td>${spec.percentage}%</td>
            </tr>
        `;
    });
    
    reportHtml += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    reportContainer.innerHTML = reportHtml;
    
    // Create charts
    createAppointmentStatusChart(data.by_status);
    createAppointmentDayChart(data.by_day);
    
    // Add print event listener
    const printBtn = document.getElementById('print-report-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Display doctor performance report
function displayDoctorPerformanceReport(data, startDate, endDate) {
    const reportContainer = document.getElementById('report-result-container');
    if (!reportContainer) return;
    
    let reportHtml = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Doctor Performance Report</h5>
                <div>
                    <span class="badge bg-secondary">${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}</span>
                    <button class="btn btn-sm btn-outline-primary ms-2" id="print-report-btn">
                        <i class="bi bi-printer"></i> Print
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.top_doctor.name}</h3>
                            <p class="text-muted">Top Doctor</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.average_appointments_per_doctor}</h3>
                            <p class="text-muted">Avg. Appointments per Doctor</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.average_rating.toFixed(1)}</h3>
                            <p class="text-muted">Average Rating</p>
                        </div>
                    </div>
                </div>
                
                <h6 class="mb-3">Doctor Performance Rankings</h6>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Doctor</th>
                            <th>Specialization</th>
                            <th>Appointments</th>
                            <th>Completion Rate</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    data.doctor_rankings.forEach(doctor => {
        reportHtml += `
            <tr>
                <td>Dr. ${doctor.name}</td>
                <td>${doctor.specialization}</td>
                <td>${doctor.appointments}</td>
                <td>${doctor.completion_rate}%</td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${doctor.rating.toFixed(1)}</span>
                        <i class="bi bi-star-fill text-warning"></i>
                    </div>
                </td>
            </tr>
        `;
    });
    
    reportHtml += `
                    </tbody>
                </table>
                
                <div class="row mt-4">
                    <div class="col-md-6 mb-4">
                        <h6 class="mb-3">Top Specializations by Volume</h6>
                        <div class="chart-container" style="position: relative; height:250px; width:100%">
                            <canvas id="topSpecializationsChart"></canvas>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <h6 class="mb-3">Doctor Ratings Distribution</h6>
                        <div class="chart-container" style="position: relative; height:250px; width:100%">
                            <canvas id="doctorRatingsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    reportContainer.innerHTML = reportHtml;
    
    // Create charts
    createTopSpecializationsChart(data.top_specializations);
    createDoctorRatingsChart(data.rating_distribution);
    
    // Add print event listener
    const printBtn = document.getElementById('print-report-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Display patient visits report
function displayPatientVisitsReport(data, startDate, endDate) {
    const reportContainer = document.getElementById('report-result-container');
    if (!reportContainer) return;
    
    let reportHtml = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Patient Visits Report</h5>
                <div>
                    <span class="badge bg-secondary">${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}</span>
                    <button class="btn btn-sm btn-outline-primary ms-2" id="print-report-btn">
                        <i class="bi bi-printer"></i> Print
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.unique_patients}</h3>
                            <p class="text-muted">Unique Patients</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.new_patients}</h3>
                            <p class="text-muted">New Patients</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.returning_patients}</h3>
                            <p class="text-muted">Returning Patients</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center p-3">
                            <h3 class="mb-0">${data.average_visits_per_patient.toFixed(1)}</h3>
                            <p class="text-muted">Avg. Visits per Patient</p>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <h6 class="mb-3">Patient Visits by Month</h6>
                        <div class="chart-container" style="position: relative; height:250px; width:100%">
                            <canvas id="visitsMonthChart"></canvas>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <h6 class="mb-3">Reason for Visit</h6>
                        <div class="chart-container" style="position: relative; height:250px; width:100%">
                            <canvas id="visitReasonChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <h6 class="mb-3">Top Patients by Visit Frequency</h6>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Visit Count</th>
                            <th>Last Visit</th>
                            <th>Most Common Reason</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    data.top_patients.forEach(patient => {
        reportHtml += `
            <tr>
                <td>${patient.name}</td>
                <td>${patient.visit_count}</td>
                <td>${formatDateOnly(patient.last_visit)}</td>
                <td>${patient.most_common_reason}</td>
            </tr>
        `;
    });
    
    reportHtml += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    reportContainer.innerHTML = reportHtml;
    
    // Create charts
    createVisitsMonthChart(data.visits_by_month);
    createVisitReasonChart(data.visit_reasons);
    
    // Add print event listener
    const printBtn = document.getElementById('print-report-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Create chart for appointment status
function createAppointmentStatusChart(data) {
    const ctx = document.getElementById('appointmentStatusChart');
    if (!ctx) return;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    const backgroundColors = [
        'rgba(40, 167, 69, 0.7)',  // Completed - Green
        'rgba(0, 123, 255, 0.7)',   // Confirmed - Blue
        'rgba(255, 193, 7, 0.7)',   // Pending - Yellow
        'rgba(220, 53, 69, 0.7)'    // Cancelled - Red
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Create chart for appointments by day
function createAppointmentDayChart(data) {
    const ctx = document.getElementById('appointmentDayChart');
    if (!ctx) return;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: 'rgba(0, 123, 255, 0.7)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Create chart for top specializations
function createTopSpecializationsChart(data) {
    const ctx = document.getElementById('topSpecializationsChart');
    if (!ctx) return;
    
    const labels = [];
    const values = [];
    
    data.forEach(item => {
        labels.push(item.specialization);
        values.push(item.count);
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: 'rgba(0, 123, 255, 0.7)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Create chart for doctor ratings
function createDoctorRatingsChart(data) {
    const ctx = document.getElementById('doctorRatingsChart');
    if (!ctx) return;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: 'rgba(40, 167, 69, 0.7)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Create chart for visits by month
function createVisitsMonthChart(data) {
    const ctx = document.getElementById('visitsMonthChart');
    if (!ctx) return;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                borderColor: 'rgba(0, 123, 255, 1)',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Create chart for visit reasons
function createVisitReasonChart(data) {
    const ctx = document.getElementById('visitReasonChart');
    if (!ctx) return;
    
    const labels = [];
    const values = [];
    const backgroundColors = [
        'rgba(0, 123, 255, 0.7)',
        'rgba(40, 167, 69, 0.7)',
        'rgba(255, 193, 7, 0.7)',
        'rgba(220, 53, 69, 0.7)',
        'rgba(111, 66, 193, 0.7)',
        'rgba(23, 162, 184, 0.7)'
    ];
    
    data.forEach(item => {
        labels.push(item.reason);
        values.push(item.count);
    });
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// View doctor details
function viewDoctorDetails(doctorId) {
    toggleContentLoading('main-content', true);
    
    makeApiRequest(`/admin/doctors/${doctorId}`)
        .then(data => {
            // Create modal for doctor details
            const modalHtml = `
                <div class="modal fade" id="doctorDetailsModal" tabindex="-1" aria-labelledby="doctorDetailsModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="doctorDetailsModalLabel">Doctor Details</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <h6 class="mb-3">Personal Information</h6>
                                        <p><strong>Name:</strong> Dr. ${data.name}</p>
                                        <p><strong>ID:</strong> ${data.id}</p>
                                        <p><strong>Email:</strong> ${data.email}</p>
                                        <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
                                        <p><strong>Specialization:</strong> ${data.specialization}</p>
                                        <p><strong>Status:</strong> <span class="badge ${data.active ? 'bg-success' : 'bg-danger'}">${data.active ? 'Active' : 'Inactive'}</span></p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="mb-3">Performance Metrics</h6>
                                        <p><strong>Appointments:</strong> ${data.appointment_count || 0}</p>
                                        <p><strong>Completion Rate:</strong> ${data.completion_rate || 0}%</p>
                                        <p><strong>Average Response Time:</strong> ${data.avg_response_time || 'N/A'}</p>
                                        <p><strong>Patient Satisfaction:</strong> ${data.rating || '0'}/5</p>
                                        <div class="progress mb-2" style="height: 20px;">
                                            <div class="progress-bar bg-primary" role="progressbar" style="width: ${(data.rating / 5) * 100}%" aria-valuenow="${data.rating}" aria-valuemin="0" aria-valuemax="5"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <h6 class="mb-3">Availability</h6>
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <p><strong>Working Days:</strong> ${data.working_days || 'Not set'}</p>
                                        <p><strong>Working Hours:</strong> ${data.working_hours || 'Not set'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Appointment Duration:</strong> ${data.appointment_duration || '30'} minutes</p>
                                        <p><strong>Time Off:</strong> ${data.time_off ? data.time_off : 'None scheduled'}</p>
                                    </div>
                                </div>
                                
                                <h6 class="mb-3">Recent Appointments</h6>
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
            `;
            
            if (data.recent_appointments && data.recent_appointments.length > 0) {
                data.recent_appointments.forEach(apt => {
                    const statusClass = getStatusBadgeClass(apt.status);
                    
                    modalHtml += `
                        <tr>
                            <td>${apt.patient_name}</td>
                            <td>${formatDate(apt.appointment_time)}</td>
                            <td><span class="badge ${statusClass}">${apt.status}</span></td>
                        </tr>
                    `;
                });
            } else {
                modalHtml += `
                    <tr>
                        <td colspan="3" class="text-center">No recent appointments</td>
                    </tr>
                `;
            }
            
            modalHtml += `
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-warning edit-doctor-modal-btn" data-id="${data.id}">Edit</button>
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
            const modal = new bootstrap.Modal(document.getElementById('doctorDetailsModal'));
            modal.show();
            
            // Add event listener for edit button
            const editBtn = document.querySelector('.edit-doctor-modal-btn');
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    const doctorId = this.getAttribute('data-id');
                    modal.hide();
                    // Remove modal from DOM after hiding
                    document.getElementById('doctorDetailsModal').addEventListener('hidden.bs.modal', function() {
                        document.body.removeChild(modalContainer);
                    });
                    
                    editDoctorDetails(doctorId);
                });
            }
            
            // Remove modal from DOM when closed
            document.getElementById('doctorDetailsModal').addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modalContainer);
            });
        })
        .catch(error => {
            console.error('Error loading doctor details:', error);
        })
        .finally(() => {
            toggleContentLoading('main-content', false);
        });
}

// Edit doctor details
function editDoctorDetails(doctorId) {
    toggleContentLoading('main-content', true);
    
    makeApiRequest(`/admin/doctors/${doctorId}`)
        .then(data => {
            // Create modal for editing doctor
            const modalHtml = `
                <div class="modal fade" id="editDoctorModal" tabindex="-1" aria-labelledby="editDoctorModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="editDoctorModalLabel">Edit Doctor</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="edit-doctor-form">
                                    <input type="hidden" id="edit-doctor-id" value="${data.id}">
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="edit-doctor-name" class="form-label">Name</label>
                                            <input type="text" class="form-control" id="edit-doctor-name" value="${data.name}" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="edit-doctor-email" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="edit-doctor-email" value="${data.email}" required>
                                        </div>
                                    </div>
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="edit-doctor-specialization" class="form-label">Specialization</label>
                                            <input type="text" class="form-control" id="edit-doctor-specialization" value="${data.specialization}" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="edit-doctor-phone" class="form-label">Phone</label>
                                            <input type="text" class="form-control" id="edit-doctor-phone" value="${data.phone || ''}">
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="edit-doctor-status" class="form-label">Status</label>
                                        <select class="form-select" id="edit-doctor-status">
                                            <option value="active" ${data.active ? 'selected' : ''}>Active</option>
                                            <option value="inactive" ${!data.active ? 'selected' : ''}>Inactive</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="edit-doctor-password" class="form-label">Password (leave blank to keep current)</label>
                                        <input type="password" class="form-control" id="edit-doctor-password" placeholder="New password">
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="save-doctor-btn">Save Changes</button>
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
            const modal = new bootstrap.Modal(document.getElementById('editDoctorModal'));
            modal.show();
            
            // Add event listener for save button
            const saveBtn = document.getElementById('save-doctor-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    const form = document.getElementById('edit-doctor-form');
                    
                    // Form validation
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }
                    
                    const doctorData = {
                        id: document.getElementById('edit-doctor-id').value,
                        name: document.getElementById('edit-doctor-name').value,
                        email: document.getElementById('edit-doctor-email').value,
                        specialization: document.getElementById('edit-doctor-specialization').value,
                        phone: document.getElementById('edit-doctor-phone').value,
                        active: document.getElementById('edit-doctor-status').value === 'active',
                        password: document.getElementById('edit-doctor-password').value
                    };
                    
                    // Remove password if empty
                    if (!doctorData.password) {
                        delete doctorData.password;
                    }
                    
                    // Submit doctor update
                    makeApiRequest(`/admin/doctors/${doctorData.id}`, 'PUT', doctorData)
                        .then(response => {
                            modal.hide();
                            // Remove modal from DOM after hiding
                            document.getElementById('editDoctorModal').addEventListener('hidden.bs.modal', function() {
                                document.body.removeChild(modalContainer);
                            });
                            
                            displayError('Doctor updated successfully');
                            
                            // Reload doctors list
                            loadDoctorsList();
                        })
                        .catch(error => {
                            console.error('Error updating doctor:', error);
                        });
                });
            }
            
            // Remove modal from DOM when closed
            document.getElementById('editDoctorModal').addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modalContainer);
            });
        })
        .catch(error => {
            console.error('Error loading doctor for editing:', error);
        })
        .finally(() => {
            toggleContentLoading('main-content', false);
        });
}

// View patient details
function viewPatientDetails(patientId) {
    toggleContentLoading('main-content', true);
    
    makeApiRequest(`/admin/patients/${patientId}`)
        .then(data => {
            // Create modal for patient details
            const modalHtml = `
                <div class="modal fade" id="patientDetailsModal" tabindex="-1" aria-labelledby="patientDetailsModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="patientDetailsModalLabel">Patient Details</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <h6 class="mb-3">Personal Information</h6>
                                        <p><strong>Name:</strong> ${data.name}</p>
                                        <p><strong>ID:</strong> ${data.id}</p>
                                        <p><strong>Email:</strong> ${data.email}</p>
                                        <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
                                        <p><strong>Date of Birth:</strong> ${data.date_of_birth ? formatDateOnly(data.date_of_birth) : 'Not provided'}</p>
                                        <p><strong>Status:</strong> <span class="badge ${data.active ? 'bg-success' : 'bg-danger'}">${data.active ? 'Active' : 'Inactive'}</span></p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="mb-3">Medical Information</h6>
                                        <p><strong>Total Appointments:</strong> ${data.appointment_count || 0}</p>
                                        <p><strong>Medical Records:</strong> ${data.record_count || 0}</p>
                                        <p><strong>Last Visit:</strong> ${data.last_visit ? formatDate(data.last_visit) : 'Never'}</p>
                                    </div>
                                </div>
                                
                                <h6 class="mb-3">Appointment History</h6>
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Doctor</th>
                                            <th>Date</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
            `;
            
            if (data.appointments && data.appointments.length > 0) {
                data.appointments.forEach(apt => {
                    const statusClass = getStatusBadgeClass(apt.status);
                    
                    modalHtml += `
                        <tr>
                            <td>Dr. ${apt.doctor_name}</td>
                            <td>${formatDate(apt.appointment_time)}</td>
                            <td>${apt.reason.substring(0, 30)}${apt.reason.length > 30 ? '...' : ''}</td>
                            <td><span class="badge ${statusClass}">${apt.status}</span></td>
                        </tr>
                    `;
                });
            } else {
                modalHtml += `
                    <tr>
                        <td colspan="4" class="text-center">No appointment history</td>
                    </tr>
                `;
            }
            
            modalHtml += `
                                    </tbody>
                                </table>
                                
                                <h6 class="mb-3 mt-4">Medical Records</h6>
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Diagnosis</th>
                                            <th>Doctor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
            `;
            
            if (data.medical_records && data.medical_records.length > 0) {
                data.medical_records.forEach(record => {
                    modalHtml += `
                        <tr>
                            <td>${formatDate(record.date)}</td>
                            <td>${record.type}</td>
                            <td>${record.diagnosis}</td>
                            <td>Dr. ${record.doctor_name}</td>
                        </tr>
                    `;
                });
            } else {
                modalHtml += `
                    <tr>
                        <td colspan="4" class="text-center">No medical records found</td>
                    </tr>
                `;
            }
            
            modalHtml += `
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-${data.active ? 'danger' : 'success'}" id="toggle-patient-status-btn" data-id="${data.id}" data-active="${data.active}">
                                    ${data.active ? 'Deactivate' : 'Activate'} Patient
                                </button>
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
            const modal = new bootstrap.Modal(document.getElementById('patientDetailsModal'));
            modal.show();
            
            // Add event listener for toggle status button
            const toggleBtn = document.getElementById('toggle-patient-status-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', function() {
                    const patientId = this.getAttribute('data-id');
                    const isActive = this.getAttribute('data-active') === 'true';
                    
                    if (confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this patient?`)) {
                        modal.hide();
                        // Remove modal from DOM after hiding
                        document.getElementById('patientDetailsModal').addEventListener('hidden.bs.modal', function() {
                            document.body.removeChild(modalContainer);
                        });
                        
                        togglePatientStatus(patientId, !isActive);
                    }
                });
            }
            
            // Remove modal from DOM when closed
            document.getElementById('patientDetailsModal').addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modalContainer);
            });
        })
        .catch(error => {
            console.error('Error loading patient details:', error);
        })
        .finally(() => {
            toggleContentLoading('main-content', false);
        });
}

// Toggle doctor status (activate/deactivate)
function toggleDoctorStatus(doctorId, activate) {
    toggleContentLoading('doctors-list-container', true);
    
    makeApiRequest(`/admin/doctors/${doctorId}/status`, 'POST', { active: activate })
        .then(response => {
            displayError(`Doctor ${activate ? 'activated' : 'deactivated'} successfully`);
            loadDoctorsList();
        })
        .catch(error => {
            console.error('Error updating doctor status:', error);
        })
        .finally(() => {
            toggleContentLoading('doctors-list-container', false);
        });
}

// Toggle patient status (activate/deactivate)
function togglePatientStatus(patientId, activate) {
    toggleContentLoading('patients-list-container', true);
    
    makeApiRequest(`/admin/patients/${patientId}/status`, 'POST', { active: activate })
        .then(response => {
            displayError(`Patient ${activate ? 'activated' : 'deactivated'} successfully`);
            loadPatientsList();
        })
        .catch(error => {
            console.error('Error updating patient status:', error);
        })
        .finally(() => {
            toggleContentLoading('patients-list-container', false);
        });
}

// Search doctors
function searchDoctors(searchTerm) {
    const doctorRows = document.querySelectorAll('.doctor-row');
    
    doctorRows.forEach(row => {
        const name = row.querySelector('.fw-bold').textContent.toLowerCase();
        const email = row.querySelector('.text-muted').textContent.toLowerCase();
        const specialization = row.cells[1].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || email.includes(searchTerm) || specialization.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Search patients
function searchPatients(searchTerm) {
    const patientRows = document.querySelectorAll('.patient-row');
    
    patientRows.forEach(row => {
        const name = row.querySelector('.fw-bold').textContent.toLowerCase();
        const id = row.querySelector('.text-muted').textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || id.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Load reports data
function loadReportsData() {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('start-date').value = formatDateForInput(startDate);
    document.getElementById('end-date').value = formatDateForInput(endDate);
}

// Format date for display (date only)
function formatDateOnly(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
