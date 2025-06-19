from datetime import datetime, date, time, timedelta
from flask import render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import func, and_, or_
from app import app, db
from models import User, Patient, Doctor, Appointment, MedicalRecord, Specialization, Disease, SystemMetrics
from utils import (
    generate_patient_id, generate_doctor_id, generate_appointment_id, 
    generate_record_id, calculate_age, format_time, format_date,
    is_doctor_available, get_doctor_working_days, validate_appointment_time,
    get_available_time_slots, get_appointment_priority_data
)
from data_structures import HDIMSDataStructures
import logging

# Initialize data structures
hdims_ds = HDIMSDataStructures()

@app.route('/')
def index():
    """Home page - redirects based on user role"""
    if current_user.is_authenticated:
        if current_user.role == 'patient':
            return redirect(url_for('patient_dashboard'))
        elif current_user.role == 'doctor':
            return redirect(url_for('doctor_dashboard'))
        elif current_user.role == 'admin':
            return redirect(url_for('admin_dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            if user.is_active:
                login_user(user)
                flash('Logged in successfully!', 'success')
                
                # Redirect based on role
                if user.role == 'patient':
                    return redirect(url_for('patient_dashboard'))
                elif user.role == 'doctor':
                    return redirect(url_for('doctor_dashboard'))
                elif user.role == 'admin':
                    return redirect(url_for('admin_dashboard'))
            else:
                flash('Your account has been deactivated. Please contact admin.', 'danger')
        else:
            flash('Invalid email or password.', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Patient registration page"""
    if request.method == 'POST':
        # Get form data
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        phone = request.form.get('phone')
        date_of_birth = request.form.get('date_of_birth')
        gender = request.form.get('gender')
        address = request.form.get('address')
        blood_type = request.form.get('blood_type')
        allergies = request.form.get('allergies')
        emergency_contact_name = request.form.get('emergency_contact_name')
        emergency_contact_phone = request.form.get('emergency_contact_phone')
        insurance_provider = request.form.get('insurance_provider')
        insurance_number = request.form.get('insurance_number')
        
        # Validation
        if User.query.filter_by(email=email).first():
            flash('Email already registered. Please use a different email.', 'danger')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('register.html')
        
        try:
            # Create user
            user = User(
                email=email,
                role='patient',
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                date_of_birth=datetime.strptime(date_of_birth, '%Y-%m-%d').date() if date_of_birth else None,
                gender=gender,
                address=address,
                is_active=True
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()
            
            # Create patient profile
            patient = Patient(
                user_id=user.id,
                patient_id=generate_patient_id(),
                blood_type=blood_type,
                allergies=allergies or 'None known',
                emergency_contact_name=emergency_contact_name,
                emergency_contact_phone=emergency_contact_phone,
                insurance_provider=insurance_provider,
                insurance_number=insurance_number
            )
            db.session.add(patient)
            db.session.commit()
            
            # Index patient in search trie
            patient_data = {
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'patient_id': patient.patient_id
            }
            hdims_ds.index_patient(user.id, patient_data)
            
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Registration error: {e}")
            flash('Registration failed. Please try again.', 'danger')
    
    return render_template('register.html')

@app.route('/doctor/register', methods=['GET', 'POST'])
def doctor_register():
    """Doctor registration page"""
    if request.method == 'POST':
        try:
            # Get form data
            first_name = request.form['first_name']
            last_name = request.form['last_name']
            email = request.form['email']
            password = request.form['password']
            phone = request.form['phone']
            date_of_birth = datetime.strptime(request.form['date_of_birth'], '%Y-%m-%d').date()
            gender = request.form['gender']
            address = request.form.get('address', '')
            
            # Doctor-specific fields
            specialization = request.form['specialization']
            license_number = request.form['license_number']
            experience_years = int(request.form['experience_years'])
            education = request.form.get('education', '')
            consultation_fee = float(request.form.get('consultation_fee', 0))
            
            # Check if email already exists
            if User.query.filter_by(email=email).first():
                flash('Email already registered. Please use a different email.', 'danger')
                return render_template('doctor_register.html')
            
            # Check if license number already exists
            if Doctor.query.filter_by(license_number=license_number).first():
                flash('License number already registered. Please check your license number.', 'danger')
                return render_template('doctor_register.html')
            
            # Create user
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                date_of_birth=date_of_birth,
                gender=gender,
                address=address,
                role='doctor'
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()
            
            # Create doctor profile
            doctor = Doctor(
                user_id=user.id,
                doctor_id=generate_doctor_id(),
                specialization=specialization,
                license_number=license_number,
                experience_years=experience_years,
                education=education,
                consultation_fee=consultation_fee
            )
            
            # Set working hours
            working_hours = [
                ('monday', 'monday_start', 'monday_end'),
                ('tuesday', 'tuesday_start', 'tuesday_end'),
                ('wednesday', 'wednesday_start', 'wednesday_end'),
                ('thursday', 'thursday_start', 'thursday_end'),
                ('friday', 'friday_start', 'friday_end'),
                ('saturday', 'saturday_start', 'saturday_end'),
                ('sunday', 'sunday_start', 'sunday_end')
            ]
            
            for day, start_field, end_field in working_hours:
                start_time = request.form.get(start_field)
                end_time = request.form.get(end_field)
                if start_time and end_time:
                    setattr(doctor, f'{day}_start', datetime.strptime(start_time, '%H:%M').time())
                    setattr(doctor, f'{day}_end', datetime.strptime(end_time, '%H:%M').time())
            
            db.session.add(doctor)
            db.session.commit()
            
            # Index doctor in search trie
            doctor_data = {
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'doctor_id': doctor.doctor_id,
                'specialization': specialization,
                'type': 'doctor'
            }
            hdims_ds.index_doctor(user.id, doctor_data)
            
            flash('Doctor registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Doctor registration error: {e}")
            flash('Registration failed. Please try again.', 'danger')
    
    return render_template('doctor_register.html')

@app.route('/admin/register', methods=['GET', 'POST'])
def admin_register():
    """Admin registration page"""
    if request.method == 'POST':
        try:
            # Check admin authorization code
            admin_code = request.form.get('admin_code')
            if admin_code != 'HDIMS_ADMIN_2025':  # Simple admin code - in production use env variable
                flash('Invalid admin authorization code.', 'danger')
                return render_template('admin_register.html')
            
            # Get form data
            first_name = request.form['first_name']
            last_name = request.form['last_name']
            email = request.form['email']
            password = request.form['password']
            phone = request.form['phone']
            date_of_birth = datetime.strptime(request.form['date_of_birth'], '%Y-%m-%d').date()
            gender = request.form['gender']
            address = request.form.get('address', '')
            
            # Check if email already exists
            if User.query.filter_by(email=email).first():
                flash('Email already registered. Please use a different email.', 'danger')
                return render_template('admin_register.html')
            
            # Create admin user
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                date_of_birth=date_of_birth,
                gender=gender,
                address=address,
                role='admin'
            )
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            
            flash('Admin registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Admin registration error: {e}")
            flash('Registration failed. Please try again.', 'danger')
    
    return render_template('admin_register.html')

@app.route('/logout')
@login_required
def logout():
    """Logout user"""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

# Patient Routes
@app.route('/patient/dashboard')
@login_required
def patient_dashboard():
    """Patient dashboard"""
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    patient = current_user.patient_profile
    if not patient:
        flash('Patient profile not found.', 'danger')
        return redirect(url_for('index'))
    
    # Get recent appointments
    recent_appointments = Appointment.query.filter_by(
        patient_id=patient.id
    ).order_by(Appointment.appointment_date.desc()).limit(5).all()
    
    # Get upcoming appointments
    upcoming_appointments = Appointment.query.filter(
        and_(
            Appointment.patient_id == patient.id,
            Appointment.appointment_date >= date.today(),
            Appointment.status == 'scheduled'
        )
    ).order_by(Appointment.appointment_date.asc()).limit(3).all()
    
    # Get recent medical records
    recent_records = MedicalRecord.query.filter_by(
        patient_id=patient.id
    ).order_by(MedicalRecord.record_date.desc()).limit(3).all()
    
    return render_template('patient/dashboard.html', 
                         patient=patient,
                         recent_appointments=recent_appointments,
                         upcoming_appointments=upcoming_appointments,
                         recent_records=recent_records)

@app.route('/patient/profile', methods=['GET', 'POST'])
@login_required
def patient_profile():
    """Patient profile management"""
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    patient = current_user.patient_profile
    if not patient:
        flash('Patient profile not found.', 'danger')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        try:
            # Update user information
            current_user.first_name = request.form.get('first_name')
            current_user.last_name = request.form.get('last_name')
            current_user.phone = request.form.get('phone')
            current_user.address = request.form.get('address')
            
            date_of_birth = request.form.get('date_of_birth')
            if date_of_birth:
                current_user.date_of_birth = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
            
            current_user.gender = request.form.get('gender')
            
            # Update patient-specific information
            patient.blood_type = request.form.get('blood_type')
            patient.allergies = request.form.get('allergies')
            patient.emergency_contact_name = request.form.get('emergency_contact_name')
            patient.emergency_contact_phone = request.form.get('emergency_contact_phone')
            patient.insurance_provider = request.form.get('insurance_provider')
            patient.insurance_number = request.form.get('insurance_number')
            
            db.session.commit()
            flash('Profile updated successfully!', 'success')
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Profile update error: {e}")
            flash('Profile update failed. Please try again.', 'danger')
    
    return render_template('patient/profile.html', patient=patient)

@app.route('/patient/book-appointment', methods=['GET', 'POST'])
@login_required
def book_appointment():
    """Book appointment page"""
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    patient = current_user.patient_profile
    if not patient:
        flash('Patient profile not found.', 'danger')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        try:
            doctor_id = request.form.get('doctor_id')
            appointment_date_str = request.form.get('appointment_date')
            appointment_time_str = request.form.get('appointment_time')
            appointment_type = request.form.get('appointment_type')
            symptoms = request.form.get('symptoms')
            
            # Validate required fields
            if not doctor_id:
                flash('Please select a doctor.', 'danger')
                return redirect(url_for('book_appointment'))
            
            if not appointment_date_str:
                flash('Please select an appointment date.', 'danger')
                return redirect(url_for('book_appointment'))
                
            if not appointment_time_str:
                flash('Please select an appointment time.', 'danger')
                return redirect(url_for('book_appointment'))
            
            # Parse date and time
            appointment_date = datetime.strptime(appointment_date_str, '%Y-%m-%d').date()
            appointment_time = datetime.strptime(appointment_time_str, '%H:%M').time()
            
            doctor = Doctor.query.get(doctor_id)
            if not doctor:
                flash('Doctor not found.', 'danger')
                return redirect(url_for('book_appointment'))
            
            # Validate appointment time
            is_valid, message = validate_appointment_time(doctor, appointment_date, appointment_time)
            if not is_valid:
                flash(message, 'danger')
                return redirect(url_for('book_appointment'))
            
            # Calculate priority score
            priority_data = {
                'appointment_type': appointment_type,
                'patient_age': calculate_age(current_user.date_of_birth),
                'appointment_date': appointment_date,
                'created_at': date.today()
            }
            priority_score = hdims_ds.appointment_queue.calculate_priority(priority_data)
            
            # Create appointment
            appointment = Appointment(
                appointment_id=generate_appointment_id(),
                patient_id=patient.id,
                doctor_id=doctor.id,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                status='scheduled',
                priority_score=priority_score,
                appointment_type=appointment_type,
                symptoms=symptoms
            )
            
            db.session.add(appointment)
            db.session.commit()
            
            # Add to priority queue
            hdims_ds.appointment_queue.add_appointment(appointment.id, priority_data)
            
            flash('Appointment booked successfully!', 'success')
            return redirect(url_for('patient_appointments'))
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Appointment booking error: {e}")
            flash('Appointment booking failed. Please try again.', 'danger')
    
    # Get all active doctors with their user information
    doctors = Doctor.query.join(User).all()
    
    return render_template('patient/book_appointment.html', 
                         doctors=doctors)

@app.route('/patient/appointments')
@login_required
def patient_appointments():
    """Patient appointments list"""
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    patient = current_user.patient_profile
    if not patient:
        flash('Patient profile not found.', 'danger')
        return redirect(url_for('index'))
    
    appointments = Appointment.query.filter_by(
        patient_id=patient.id
    ).order_by(Appointment.appointment_date.desc()).all()
    
    return render_template('patient/appointments.html', appointments=appointments)

@app.route('/patient/medical-records')
@login_required
def patient_medical_records():
    """Patient medical records"""
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    patient = current_user.patient_profile
    if not patient:
        flash('Patient profile not found.', 'danger')
        return redirect(url_for('index'))
    
    medical_records = MedicalRecord.query.filter_by(
        patient_id=patient.id
    ).order_by(MedicalRecord.record_date.desc()).all()
    
    return render_template('patient/medical_records.html', 
                         medical_records=medical_records,
                         patient=patient)

# Doctor Routes
@app.route('/doctor/dashboard')
@login_required
def doctor_dashboard():
    """Doctor dashboard"""
    if current_user.role != 'doctor':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    doctor = current_user.doctor_profile
    if not doctor:
        flash('Doctor profile not found.', 'danger')
        return redirect(url_for('index'))
    
    # Today's appointments
    today_appointments = Appointment.query.filter(
        and_(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == date.today()
        )
    ).order_by(Appointment.appointment_time.asc()).all()
    
    # Upcoming appointments
    upcoming_appointments = Appointment.query.filter(
        and_(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date > date.today(),
            Appointment.status == 'scheduled'
        )
    ).order_by(Appointment.appointment_date.asc()).limit(5).all()
    
    # Recent patients
    recent_patients = db.session.query(Patient).join(Appointment).filter(
        Appointment.doctor_id == doctor.id
    ).order_by(Appointment.created_at.desc()).limit(5).all()
    
    return render_template('doctor/dashboard.html',
                         doctor=doctor,
                         today_appointments=today_appointments,
                         upcoming_appointments=upcoming_appointments,
                         recent_patients=recent_patients)

@app.route('/doctor/profile', methods=['GET', 'POST'])
@login_required
def doctor_profile():
    """Doctor profile management"""
    if current_user.role != 'doctor':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    doctor = current_user.doctor_profile
    if not doctor:
        flash('Doctor profile not found.', 'danger')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        try:
            # Update user information
            current_user.first_name = request.form.get('first_name')
            current_user.last_name = request.form.get('last_name')
            current_user.phone = request.form.get('phone')
            current_user.address = request.form.get('address')
            
            # Update doctor-specific information
            doctor.specialization = request.form.get('specialization')
            doctor.experience_years = int(request.form.get('experience_years', 0))
            doctor.education = request.form.get('education')
            doctor.consultation_fee = float(request.form.get('consultation_fee', 0))
            
            # Update working hours
            days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            for day in days:
                start_time_str = request.form.get(f'{day}_start')
                end_time_str = request.form.get(f'{day}_end')
                
                if start_time_str:
                    setattr(doctor, f'{day}_start', datetime.strptime(start_time_str, '%H:%M').time())
                else:
                    setattr(doctor, f'{day}_start', None)
                
                if end_time_str:
                    setattr(doctor, f'{day}_end', datetime.strptime(end_time_str, '%H:%M').time())
                else:
                    setattr(doctor, f'{day}_end', None)
            
            db.session.commit()
            flash('Profile updated successfully!', 'success')
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Doctor profile update error: {e}")
            flash('Profile update failed. Please try again.', 'danger')
    
    # Get all available specializations
    specializations_list = [
        'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
        'General Medicine', 'Gynecology', 'Neurology', 'Oncology',
        'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology',
        'Surgery', 'Urology'
    ]
    working_days = get_doctor_working_days(doctor)
    
    return render_template('doctor/profile.html', 
                         doctor=doctor, 
                         specializations=specializations_list,
                         working_days=working_days)

@app.route('/doctor/appointments')
@login_required
def doctor_appointments():
    """Doctor appointments list"""
    if current_user.role != 'doctor':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    doctor = current_user.doctor_profile
    if not doctor:
        flash('Doctor profile not found.', 'danger')
        return redirect(url_for('index'))
    
    appointments = Appointment.query.filter_by(
        doctor_id=doctor.id
    ).order_by(Appointment.appointment_date.desc()).all()
    
    return render_template('doctor/appointments.html', appointments=appointments)

@app.route('/doctor/schedule')
@login_required
def doctor_schedule():
    """Doctor schedule view"""
    if current_user.role != 'doctor':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    doctor = current_user.doctor_profile
    if not doctor:
        flash('Doctor profile not found.', 'danger')
        return redirect(url_for('index'))
    
    # Get current week appointments
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    week_appointments = Appointment.query.filter(
        and_(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date >= start_of_week,
            Appointment.appointment_date <= end_of_week
        )
    ).order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).all()
    
    # Get working days
    working_days = get_doctor_working_days(doctor)
    
    return render_template('doctor/schedule.html', 
                         doctor=doctor,
                         week_appointments=week_appointments,
                         working_days=working_days,
                         start_of_week=start_of_week,
                         end_of_week=end_of_week)

@app.route('/doctor/patients')
@login_required  
def doctor_patients():
    """Doctor's patient list"""
    if current_user.role != 'doctor':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    doctor = current_user.doctor_profile
    if not doctor:
        flash('Doctor profile not found.', 'danger')
        return redirect(url_for('index'))
    
    # Get all patients who have had appointments with this doctor
    patients = db.session.query(Patient).join(Appointment).filter(
        Appointment.doctor_id == doctor.id
    ).distinct().all()
    
    # Get patient statistics and medical records
    patient_stats = {}
    for patient in patients:
        total_appointments = Appointment.query.filter_by(
            patient_id=patient.id,
            doctor_id=doctor.id
        ).count()
        
        last_appointment = Appointment.query.filter_by(
            patient_id=patient.id,
            doctor_id=doctor.id
        ).order_by(Appointment.appointment_date.desc()).first()
        
        # Get medical records for this patient from this doctor
        medical_records = MedicalRecord.query.filter_by(
            patient_id=patient.id,
            doctor_id=doctor.id
        ).order_by(MedicalRecord.record_date.desc()).all()
        
        patient_stats[patient.id] = {
            'total_appointments': total_appointments,
            'last_appointment': last_appointment,
            'medical_records': medical_records,
            'total_records': len(medical_records)
        }
    
    return render_template('doctor/patients.html', 
                         patients=patients,
                         patient_stats=patient_stats)

@app.route('/doctor/patient/<int:patient_id>/medical-records')
@login_required
def doctor_view_patient_records(patient_id):
    """Doctor view specific patient's medical records"""
    if current_user.role != 'doctor':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    doctor = current_user.doctor_profile
    if not doctor:
        flash('Doctor profile not found.', 'danger')
        return redirect(url_for('index'))
    
    patient = Patient.query.get_or_404(patient_id)
    
    # Check if doctor has treated this patient
    has_treated = Appointment.query.filter_by(
        patient_id=patient.id,
        doctor_id=doctor.id
    ).first()
    
    if not has_treated:
        flash('You can only view records of patients you have treated.', 'danger')
        return redirect(url_for('doctor_patients'))
    
    # Get all medical records for this patient from this doctor
    medical_records = MedicalRecord.query.filter_by(
        patient_id=patient.id,
        doctor_id=doctor.id
    ).order_by(MedicalRecord.record_date.desc()).all()
    
    return render_template('doctor/patient_medical_records.html', 
                         patient=patient,
                         medical_records=medical_records)

@app.route('/doctor/appointment/<int:appointment_id>/complete', methods=['POST'])
@login_required
def complete_appointment(appointment_id):
    """Complete an appointment and add medical record"""
    if current_user.role != 'doctor':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    doctor = current_user.doctor_profile
    appointment = Appointment.query.get_or_404(appointment_id)
    
    if appointment.doctor_id != doctor.id:
        flash('Access denied.', 'danger')
        return redirect(url_for('doctor_appointments'))
    
    try:
        # Update appointment status
        appointment.status = 'completed'
        appointment.notes = request.form.get('notes')
        
        # Create medical record if diagnosis is provided
        diagnosis = request.form.get('diagnosis')
        if diagnosis:
            medical_record = MedicalRecord(
                record_id=generate_record_id(),
                patient_id=appointment.patient_id,
                doctor_id=doctor.id,
                appointment_id=appointment.id,
                record_date=date.today(),
                diagnosis=diagnosis,
                symptoms=request.form.get('symptoms'),
                treatment=request.form.get('treatment'),
                prescription=request.form.get('prescription'),
                lab_results=request.form.get('lab_results'),
                notes=request.form.get('medical_notes'),
                follow_up_required=bool(request.form.get('follow_up_required'))
            )
            
            follow_up_date = request.form.get('follow_up_date')
            if follow_up_date:
                medical_record.follow_up_date = datetime.strptime(follow_up_date, '%Y-%m-%d').date()
            
            db.session.add(medical_record)
        
        db.session.commit()
        flash('Appointment completed successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Complete appointment error: {e}")
        flash('Failed to complete appointment. Please try again.', 'danger')
    
    return redirect(url_for('doctor_appointments'))

# Admin Routes
@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    """Admin dashboard"""
    if current_user.role != 'admin':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    # Get system statistics
    total_patients = Patient.query.count()
    total_doctors = Doctor.query.count()
    total_appointments = Appointment.query.count()
    total_users = User.query.count()
    
    # Recent appointments
    recent_appointments = Appointment.query.order_by(
        Appointment.created_at.desc()
    ).limit(10).all()
    
    # Monthly appointment data for chart
    monthly_query = db.session.query(
        func.date_trunc('month', Appointment.appointment_date).label('month'),
        func.count(Appointment.id).label('count')
    ).group_by('month').order_by('month').all()
    
    # Convert to JSON-serializable format
    monthly_data = []
    for row in monthly_query:
        monthly_data.append({
            'month': row.month.strftime('%Y-%m') if row.month else '',
            'count': row.count
        })
    
    # Get appointment status distribution
    status_data = db.session.query(
        Appointment.status,
        func.count(Appointment.id).label('count')
    ).group_by(Appointment.status).all()
    
    status_distribution = []
    for row in status_data:
        status_distribution.append({
            'status': row.status,
            'count': row.count
        })
    
    # Get doctor specialization distribution
    specialization_data = db.session.query(
        Doctor.specialization,
        func.count(Doctor.id).label('count')
    ).group_by(Doctor.specialization).all()
    
    specialization_distribution = []
    for row in specialization_data:
        specialization_distribution.append({
            'specialization': row.specialization,
            'count': row.count
        })
    
    return render_template('admin/dashboard.html',
                         total_patients=total_patients,
                         total_doctors=total_doctors,
                         total_appointments=total_appointments,
                         total_users=total_users,
                         recent_appointments=recent_appointments,
                         monthly_data=monthly_data,
                         status_distribution=status_distribution,
                         specialization_distribution=specialization_distribution)

@app.route('/admin/users')
@login_required
def admin_users():
    """Admin users management"""
    if current_user.role != 'admin':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    page = request.args.get('page', 1, type=int)
    role_filter = request.args.get('role', '')
    search_query = request.args.get('search', '')
    
    query = User.query
    if role_filter:
        query = query.filter_by(role=role_filter)
    
    if search_query:
        query = query.filter(
            or_(
                User.first_name.ilike(f'%{search_query}%'),
                User.last_name.ilike(f'%{search_query}%'),
                User.email.ilike(f'%{search_query}%')
            )
        )
    
    users = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    return render_template('admin/users.html', users=users, role_filter=role_filter)

@app.route('/admin/user/<int:user_id>/toggle-status', methods=['POST'])
@login_required
def toggle_user_status(user_id):
    """Toggle user active status"""
    if current_user.role != 'admin':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash('Cannot deactivate your own account.', 'danger')
        return redirect(url_for('admin_users'))
    
    try:
        user.is_active = not user.is_active
        db.session.commit()
        status = 'activated' if user.is_active else 'deactivated'
        flash(f'User {user.full_name} has been {status}.', 'success')
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Toggle user status error: {e}")
        flash('Failed to update user status.', 'danger')
    
    return redirect(url_for('admin_users'))

@app.route('/admin/analytics')
@login_required
def admin_analytics():
    """Admin analytics page"""
    if current_user.role != 'admin':
        flash('Access denied.', 'danger')
        return redirect(url_for('index'))
    
    # Appointment statistics
    appointment_stats_raw = db.session.query(
        Appointment.status,
        func.count(Appointment.id).label('count')
    ).group_by(Appointment.status).all()
    
    appointment_stats = [{'status': row.status, 'count': row.count} for row in appointment_stats_raw]
    
    # Doctor specialization distribution
    specialization_stats_raw = db.session.query(
        Doctor.specialization,
        func.count(Doctor.id).label('count')
    ).group_by(Doctor.specialization).all()
    
    specialization_stats = [{'specialization': row.specialization, 'count': row.count} for row in specialization_stats_raw]
    
    # Monthly appointment trends - simplified for compatibility
    try:
        monthly_trends_raw = db.session.query(
            func.date_trunc('month', Appointment.appointment_date).label('month'),
            func.count(Appointment.id).label('appointments')
        ).group_by(func.date_trunc('month', Appointment.appointment_date)).order_by('month').all()
        
        monthly_trends = []
        for row in monthly_trends_raw:
            if row.month:
                monthly_trends.append({
                    'month': row.month.strftime('%Y-%m'),
                    'appointments': row.appointments
                })
    except Exception as e:
        print(f"Monthly trends error: {e}")
        monthly_trends = []
    
    # Daily appointment distribution
    try:
        daily_stats_raw = db.session.query(
            func.extract('dow', Appointment.appointment_date).label('day_of_week'),
            func.count(Appointment.id).label('count')
        ).group_by(func.extract('dow', Appointment.appointment_date)).all()
        
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        daily_stats = []
        for row in daily_stats_raw:
            if row.day_of_week is not None:
                day_index = int(row.day_of_week)
                daily_stats.append({
                    'day_name': day_names[day_index],
                    'day_of_week': day_index,
                    'count': row.count
                })
    except Exception as e:
        print(f"Daily stats error: {e}")
        daily_stats = []
    
    # Patient age distribution - simplified
    try:
        current_year = datetime.now().year
        age_stats_raw = db.session.query(
            func.floor((current_year - func.extract('year', User.date_of_birth)) / 10).label('age_group'),
            func.count(User.id).label('count')
        ).join(Patient).filter(User.date_of_birth.isnot(None)).group_by(
            func.floor((current_year - func.extract('year', User.date_of_birth)) / 10)
        ).all()
        
        age_stats = []
        for row in age_stats_raw:
            if row.age_group is not None:
                age_group = int(row.age_group) * 10
                age_stats.append({
                    'age_range': f"{age_group}-{age_group + 9}",
                    'count': row.count
                })
    except Exception as e:
        print(f"Age stats error: {e}")
        age_stats = []
    
    return render_template('admin/analytics.html',
                         appointment_stats=appointment_stats,
                         specialization_stats=specialization_stats,
                         monthly_trends=monthly_trends,
                         daily_stats=daily_stats,
                         age_stats=age_stats)

# API Routes for AJAX calls
@app.route('/api/doctors/<specialization>')
@login_required
def get_doctors_by_specialization(specialization):
    """Get doctors by specialization"""
    doctors = Doctor.query.filter_by(specialization=specialization).all()
    return jsonify([{
        'id': doctor.id,
        'name': doctor.user.full_name,
        'experience_years': doctor.experience_years,
        'consultation_fee': doctor.consultation_fee,
        'rating': doctor.rating
    } for doctor in doctors])

@app.route('/api/doctor/<int:doctor_id>/available-slots')
@login_required
def get_available_slots(doctor_id):
    """Get available time slots for a doctor"""
    appointment_date = request.args.get('date')
    if not appointment_date:
        return jsonify({'error': 'Date is required'}), 400
    
    try:
        appointment_date = datetime.strptime(appointment_date, '%Y-%m-%d').date()
        doctor = Doctor.query.get_or_404(doctor_id)
        
        available_slots = get_available_time_slots(doctor, appointment_date)
        return jsonify({'slots': available_slots})
        
    except Exception as e:
        logging.error(f"Get available slots error: {e}")
        return jsonify({'error': 'Failed to get available slots'}), 500

@app.route('/api/search/patients')
@login_required
def search_patients_api():
    """Search patients API for autocomplete"""
    if current_user.role not in ['doctor', 'admin']:
        return jsonify({'error': 'Access denied'}), 403
    
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
    
    results = hdims_ds.search_patients(query, limit=10)
    return jsonify([{
        'name': name,
        'data': data[0]['data'] if data else {}
    } for name, data in results])

@app.route('/api/search/doctors')
@login_required
def search_doctors_api():
    """Search doctors API for autocomplete"""
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
    
    results = hdims_ds.search_doctors(query, limit=10)
    return jsonify([{
        'name': name,
        'data': data[0]['data'] if data else {}
    } for name, data in results])

@app.route('/api/search/diseases')
@login_required
def search_diseases_api():
    """Search diseases API for autocomplete"""
    if current_user.role != 'doctor':
        return jsonify({'error': 'Access denied'}), 403
    
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
    
    results = hdims_ds.search_diseases(query, limit=10)
    return jsonify([{
        'name': name,
        'data': data[0]['data'] if data else {}
    } for name, data in results])

# Template context processors
@app.context_processor
def utility_processor():
    """Add utility functions to template context"""
    return dict(
        calculate_age=calculate_age,
        format_time=format_time,
        format_date=format_date,
        now=datetime.now,
        today=date.today,
        timedelta=timedelta
    )

# Initialize data structures with existing data
def initialize_data_structures():
    """Initialize data structures with existing database data"""
    try:
        # Index patients
        patients = db.session.query(Patient).join(User).all()
        for patient in patients:
            patient_data = {
                'first_name': patient.user.first_name,
                'last_name': patient.user.last_name,
                'email': patient.user.email,
                'patient_id': patient.patient_id,
                'type': 'patient'
            }
            hdims_ds.index_patient(patient.user.id, patient_data)
        
        # Index doctors
        doctors = db.session.query(Doctor).join(User).all()
        for doctor in doctors:
            doctor_data = {
                'first_name': doctor.user.first_name,
                'last_name': doctor.user.last_name,
                'email': doctor.user.email,
                'doctor_id': doctor.doctor_id,
                'specialization': doctor.specialization,
                'rating': doctor.rating,
                'experience_years': doctor.experience_years,
                'type': 'doctor'
            }
            hdims_ds.index_doctor(doctor.user.id, doctor_data)
        
        # Index diseases
        diseases = Disease.query.all()
        for disease in diseases:
            disease_data = {
                'name': disease.name,
                'description': disease.description,
                'symptoms': disease.symptoms,
                'category': disease.category,
                'type': 'disease'
            }
            hdims_ds.index_disease(disease.name, disease_data)
        
        logging.info("Data structures initialized with existing data")
        
    except Exception as e:
        logging.error(f"Error initializing data structures: {e}")

# Initialize data structures when the module is imported
try:
    with app.app_context():
        initialize_data_structures()
except Exception as e:
    logging.error(f"Failed to initialize data structures: {e}")

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500
