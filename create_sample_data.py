#!/usr/bin/env python3
"""
Create sample data for HDIMS to test admin dashboard analytics
"""

from datetime import date, time, datetime, timedelta
import random
from app import app, db
from models import User, Patient, Doctor, Appointment, MedicalRecord, Specialization, Disease
from utils import (generate_patient_id, generate_doctor_id, generate_appointment_id, 
                   generate_record_id, initialize_system_data)

def create_sample_data():
    """Create comprehensive sample data for testing"""
    with app.app_context():
        print("Creating sample data for HDIMS...")
        
        # Initialize system data first
        initialize_system_data()
        
        # Create sample patients
        sample_patients = [
            {'email': 'john.doe@email.com', 'first_name': 'John', 'last_name': 'Doe', 'gender': 'Male', 'dob': date(1985, 3, 15)},
            {'email': 'jane.smith@email.com', 'first_name': 'Jane', 'last_name': 'Smith', 'gender': 'Female', 'dob': date(1992, 7, 22)},
            {'email': 'bob.johnson@email.com', 'first_name': 'Bob', 'last_name': 'Johnson', 'gender': 'Male', 'dob': date(1978, 11, 8)},
            {'email': 'alice.brown@email.com', 'first_name': 'Alice', 'last_name': 'Brown', 'gender': 'Female', 'dob': date(1988, 5, 30)},
            {'email': 'charlie.wilson@email.com', 'first_name': 'Charlie', 'last_name': 'Wilson', 'gender': 'Male', 'dob': date(1995, 12, 12)},
        ]
        
        created_patients = []
        for patient_data in sample_patients:
            if not User.query.filter_by(email=patient_data['email']).first():
                user = User(
                    email=patient_data['email'],
                    role='patient',
                    first_name=patient_data['first_name'],
                    last_name=patient_data['last_name'],
                    phone=f"555-{random.randint(1000, 9999)}",
                    date_of_birth=patient_data['dob'],
                    gender=patient_data['gender'],
                    address=f"{random.randint(100, 999)} {random.choice(['Main', 'Oak', 'Pine', 'Elm'])} St",
                    is_active=True
                )
                user.set_password('patient123')
                db.session.add(user)
                db.session.flush()
                
                patient = Patient(
                    user_id=user.id,
                    patient_id=generate_patient_id(),
                    blood_type=random.choice(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
                    allergies=random.choice(['None known', 'Penicillin', 'Peanuts', 'Shellfish']),
                    emergency_contact_name=f"Emergency Contact {random.randint(1, 100)}",
                    emergency_contact_phone=f"555-{random.randint(1000, 9999)}",
                    insurance_provider=random.choice(['BlueCross', 'Aetna', 'United Health', 'Cigna'])
                )
                db.session.add(patient)
                created_patients.append(patient)
        
        # Create sample doctors
        sample_doctors = [
            {'email': 'dr.wilson@hdims.com', 'first_name': 'Emily', 'last_name': 'Wilson', 'specialization': 'Cardiology'},
            {'email': 'dr.martinez@hdims.com', 'first_name': 'Carlos', 'last_name': 'Martinez', 'specialization': 'Neurology'},
            {'email': 'dr.lee@hdims.com', 'first_name': 'Sarah', 'last_name': 'Lee', 'specialization': 'Pediatrics'},
            {'email': 'dr.thompson@hdims.com', 'first_name': 'Michael', 'last_name': 'Thompson', 'specialization': 'Orthopedics'},
            {'email': 'dr.davis@hdims.com', 'first_name': 'Jennifer', 'last_name': 'Davis', 'specialization': 'Dermatology'},
            {'email': 'dr.garcia@hdims.com', 'first_name': 'Roberto', 'last_name': 'Garcia', 'specialization': 'Internal Medicine'},
        ]
        
        created_doctors = []
        for doctor_data in sample_doctors:
            if not User.query.filter_by(email=doctor_data['email']).first():
                user = User(
                    email=doctor_data['email'],
                    role='doctor',
                    first_name=doctor_data['first_name'],
                    last_name=doctor_data['last_name'],
                    phone=f"555-{random.randint(1000, 9999)}",
                    is_active=True
                )
                user.set_password('doctor123')
                db.session.add(user)
                db.session.flush()
                
                doctor = Doctor(
                    user_id=user.id,
                    doctor_id=generate_doctor_id(),
                    specialization=doctor_data['specialization'],
                    license_number=f"MD{random.randint(100000, 999999)}",
                    experience_years=random.randint(5, 25),
                    education=f"MD from {random.choice(['Harvard', 'Johns Hopkins', 'Stanford', 'Mayo Clinic'])}",
                    consultation_fee=random.randint(150, 500),
                    rating=round(random.uniform(4.0, 5.0), 1),
                    total_reviews=random.randint(10, 100),
                    monday_start=time(9, 0),
                    monday_end=time(17, 0),
                    tuesday_start=time(9, 0),
                    tuesday_end=time(17, 0),
                    wednesday_start=time(9, 0),
                    wednesday_end=time(17, 0),
                    thursday_start=time(9, 0),
                    thursday_end=time(17, 0),
                    friday_start=time(9, 0),
                    friday_end=time(17, 0)
                )
                db.session.add(doctor)
                created_doctors.append(doctor)
        
        db.session.commit()
        
        # Get all patients and doctors for appointments
        all_patients = Patient.query.all()
        all_doctors = Doctor.query.all()
        
        # Create sample appointments across different months and statuses
        appointment_statuses = ['scheduled', 'completed', 'cancelled', 'rescheduled']
        created_appointments = []
        
        # Create appointments for the last 6 months
        for month_offset in range(6):
            appointment_date = date.today() - timedelta(days=30 * month_offset)
            appointments_this_month = random.randint(5, 15)
            
            for _ in range(appointments_this_month):
                patient = random.choice(all_patients)
                doctor = random.choice(all_doctors)
                status = random.choice(appointment_statuses)
                
                appointment = Appointment(
                    appointment_id=generate_appointment_id(),
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    appointment_date=appointment_date + timedelta(days=random.randint(0, 29)),
                    appointment_time=time(random.randint(9, 16), random.choice([0, 30])),
                    status=status,
                    priority_score=random.randint(1, 10),
                    appointment_type=random.choice(['consultation', 'follow-up', 'emergency']),
                    symptoms=random.choice(['Headache', 'Chest pain', 'Fever', 'Back pain', 'Fatigue']),
                    notes=f"Sample appointment note {random.randint(1, 100)}"
                )
                db.session.add(appointment)
                created_appointments.append(appointment)
        
        db.session.commit()
        
        # Create sample medical records for completed appointments
        completed_appointments = [apt for apt in created_appointments if apt.status == 'completed']
        
        for appointment in completed_appointments[:20]:  # Create records for first 20 completed appointments
            record = MedicalRecord(
                record_id=generate_record_id(),
                patient_id=appointment.patient_id,
                doctor_id=appointment.doctor_id,
                appointment_id=appointment.id,
                record_date=appointment.appointment_date,
                diagnosis=random.choice(['Hypertension', 'Diabetes Type 2', 'Common Cold', 'Migraine', 'Arthritis']),
                symptoms=appointment.symptoms,
                treatment=random.choice(['Medication prescribed', 'Physical therapy', 'Rest and fluids', 'Follow-up required']),
                prescription=random.choice(['Ibuprofen 400mg', 'Lisinopril 10mg', 'Metformin 500mg', 'No prescription']),
                notes=f"Patient responded well to treatment. {random.randint(1, 100)}",
                follow_up_required=random.choice([True, False])
            )
            if record.follow_up_required:
                record.follow_up_date = appointment.appointment_date + timedelta(days=random.randint(7, 30))
            
            db.session.add(record)
        
        db.session.commit()
        
        print(f"Sample data created successfully!")
        print(f"- Patients: {len(created_patients)}")
        print(f"- Doctors: {len(created_doctors)}")
        print(f"- Appointments: {len(created_appointments)}")
        print(f"- Medical Records: {len([apt for apt in created_appointments if apt.status == 'completed'])}")

if __name__ == '__main__':
    create_sample_data()