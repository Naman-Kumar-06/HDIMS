from datetime import datetime, date, time
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Text, Date, Time, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(Integer, primary_key=True)
    email = db.Column(String(120), unique=True, nullable=False)
    password_hash = db.Column(String(256), nullable=False)
    role = db.Column(String(20), nullable=False)  # 'patient', 'doctor', 'admin'
    first_name = db.Column(String(50), nullable=False)
    last_name = db.Column(String(50), nullable=False)
    phone = db.Column(String(20))
    date_of_birth = db.Column(Date)
    gender = db.Column(String(10))
    address = db.Column(Text)
    is_active = db.Column(Boolean, default=True)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    patient_id = db.Column(String(20), unique=True, nullable=False)
    blood_type = db.Column(String(5))
    allergies = db.Column(Text)
    emergency_contact_name = db.Column(String(100))
    emergency_contact_phone = db.Column(String(20))
    insurance_provider = db.Column(String(100))
    insurance_number = db.Column(String(50))
    
    # Relationships
    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")

class Doctor(db.Model):
    __tablename__ = 'doctors'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(String(20), unique=True, nullable=False)
    specialization = db.Column(String(100), nullable=False)
    license_number = db.Column(String(50), unique=True, nullable=False)
    experience_years = db.Column(Integer)
    education = db.Column(Text)
    consultation_fee = db.Column(Float)
    rating = db.Column(Float, default=0.0)
    total_reviews = db.Column(Integer, default=0)
    
    # Working hours
    monday_start = db.Column(Time)
    monday_end = db.Column(Time)
    tuesday_start = db.Column(Time)
    tuesday_end = db.Column(Time)
    wednesday_start = db.Column(Time)
    wednesday_end = db.Column(Time)
    thursday_start = db.Column(Time)
    thursday_end = db.Column(Time)
    friday_start = db.Column(Time)
    friday_end = db.Column(Time)
    saturday_start = db.Column(Time)
    saturday_end = db.Column(Time)
    sunday_start = db.Column(Time)
    sunday_end = db.Column(Time)
    
    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor")
    medical_records = relationship("MedicalRecord", back_populates="doctor")

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(Integer, primary_key=True)
    appointment_id = db.Column(String(20), unique=True, nullable=False)
    patient_id = db.Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(Integer, ForeignKey('doctors.id'), nullable=False)
    appointment_date = db.Column(Date, nullable=False)
    appointment_time = db.Column(Time, nullable=False)
    status = db.Column(String(20), default='scheduled')  # scheduled, completed, cancelled, rescheduled
    priority_score = db.Column(Integer, default=0)
    appointment_type = db.Column(String(50))  # consultation, follow-up, emergency
    symptoms = db.Column(Text)
    notes = db.Column(Text)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'
    
    id = db.Column(Integer, primary_key=True)
    record_id = db.Column(String(20), unique=True, nullable=False)
    patient_id = db.Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(Integer, ForeignKey('doctors.id'), nullable=False)
    appointment_id = db.Column(Integer, ForeignKey('appointments.id'))
    record_date = db.Column(Date, nullable=False)
    diagnosis = db.Column(Text)
    symptoms = db.Column(Text)
    treatment = db.Column(Text)
    prescription = db.Column(Text)
    lab_results = db.Column(Text)
    notes = db.Column(Text)
    follow_up_required = db.Column(Boolean, default=False)
    follow_up_date = db.Column(Date)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("Doctor", back_populates="medical_records")
    appointment = relationship("Appointment")

class Specialization(db.Model):
    __tablename__ = 'specializations'
    
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(100), unique=True, nullable=False)
    description = db.Column(Text)

class Disease(db.Model):
    __tablename__ = 'diseases'
    
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(200), unique=True, nullable=False)
    description = db.Column(Text)
    symptoms = db.Column(Text)
    category = db.Column(String(100))

class DoctorReferral(db.Model):
    __tablename__ = 'doctor_referrals'
    
    id = db.Column(Integer, primary_key=True)
    referring_doctor_id = db.Column(Integer, ForeignKey('doctors.id'), nullable=False)
    referred_doctor_id = db.Column(Integer, ForeignKey('doctors.id'), nullable=False)
    patient_id = db.Column(Integer, ForeignKey('patients.id'), nullable=False)
    referral_reason = db.Column(Text)
    referral_date = db.Column(Date, default=date.today)
    status = db.Column(String(20), default='pending')  # pending, accepted, completed
    
    # Relationships
    referring_doctor = relationship("Doctor", foreign_keys=[referring_doctor_id])
    referred_doctor = relationship("Doctor", foreign_keys=[referred_doctor_id])
    patient = relationship("Patient")

class SystemMetrics(db.Model):
    __tablename__ = 'system_metrics'
    
    id = db.Column(Integer, primary_key=True)
    metric_date = db.Column(Date, nullable=False)
    total_appointments = db.Column(Integer, default=0)
    total_patients = db.Column(Integer, default=0)
    total_doctors = db.Column(Integer, default=0)
    revenue = db.Column(Float, default=0.0)
    average_wait_time = db.Column(Float, default=0.0)
    patient_satisfaction = db.Column(Float, default=0.0)
    created_at = db.Column(DateTime, default=datetime.utcnow)
