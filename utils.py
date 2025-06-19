import random
import string
from datetime import datetime, date, time
from app import db
from models import User, Patient, Doctor, Appointment, MedicalRecord, Specialization, Disease

def generate_id(prefix, length=8):
    """Generate unique ID with prefix"""
    suffix = ''.join(random.choices(string.digits, k=length))
    return f"{prefix}{suffix}"

def generate_patient_id():
    """Generate unique patient ID"""
    while True:
        patient_id = generate_id("PAT", 6)
        if not Patient.query.filter_by(patient_id=patient_id).first():
            return patient_id

def generate_doctor_id():
    """Generate unique doctor ID"""
    while True:
        doctor_id = generate_id("DOC", 6)
        if not Doctor.query.filter_by(doctor_id=doctor_id).first():
            return doctor_id

def generate_appointment_id():
    """Generate unique appointment ID"""
    while True:
        appointment_id = generate_id("APT", 8)
        if not Appointment.query.filter_by(appointment_id=appointment_id).first():
            return appointment_id

def generate_record_id():
    """Generate unique medical record ID"""
    while True:
        record_id = generate_id("REC", 8)
        if not MedicalRecord.query.filter_by(record_id=record_id).first():
            return record_id

def calculate_age(birth_date):
    """Calculate age from birth date"""
    if not birth_date:
        return 0
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

def format_time(time_obj):
    """Format time object to readable string"""
    if not time_obj:
        return "Not set"
    return time_obj.strftime("%I:%M %p")

def format_date(date_obj):
    """Format date object to readable string"""
    if not date_obj:
        return "Not set"
    return date_obj.strftime("%B %d, %Y")

def format_datetime(datetime_obj):
    """Format datetime object to readable string"""
    if not datetime_obj:
        return "Not set"
    return datetime_obj.strftime("%B %d, %Y at %I:%M %p")

def is_doctor_available(doctor, day_of_week, appointment_time):
    """Check if doctor is available on given day and time"""
    day_mapping = {
        0: ('monday_start', 'monday_end'),
        1: ('tuesday_start', 'tuesday_end'),
        2: ('wednesday_start', 'wednesday_end'),
        3: ('thursday_start', 'thursday_end'),
        4: ('friday_start', 'friday_end'),
        5: ('saturday_start', 'saturday_end'),
        6: ('sunday_start', 'sunday_end')
    }
    
    if day_of_week not in day_mapping:
        return False
    
    start_attr, end_attr = day_mapping[day_of_week]
    start_time = getattr(doctor, start_attr)
    end_time = getattr(doctor, end_attr)
    
    if not start_time or not end_time:
        return False
    
    return start_time <= appointment_time <= end_time

def get_doctor_working_days(doctor):
    """Get list of working days for a doctor"""
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    working_days = []
    
    for i, day in enumerate(days):
        day_lower = day.lower()
        start_time = getattr(doctor, f"{day_lower}_start")
        end_time = getattr(doctor, f"{day_lower}_end")
        
        if start_time and end_time:
            working_days.append({
                'day': day,
                'day_index': i,
                'start_time': format_time(start_time),
                'end_time': format_time(end_time)
            })
    
    return working_days

def validate_appointment_time(doctor, appointment_date, appointment_time):
    """Validate if appointment can be scheduled"""
    # Check if doctor works on this day
    day_of_week = appointment_date.weekday()
    if not is_doctor_available(doctor, day_of_week, appointment_time):
        return False, "Doctor is not available on this day/time"
    
    # Check for existing appointments at the same time
    existing_appointment = Appointment.query.filter_by(
        doctor_id=doctor.id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        status='scheduled'
    ).first()
    
    if existing_appointment:
        return False, "Doctor already has an appointment at this time"
    
    return True, "Appointment time is available"

def get_available_time_slots(doctor, appointment_date, slot_duration=30):
    """Get available time slots for a doctor on a given date"""
    day_of_week = appointment_date.weekday()
    day_mapping = {
        0: ('monday_start', 'monday_end'),
        1: ('tuesday_start', 'tuesday_end'),
        2: ('wednesday_start', 'wednesday_end'),
        3: ('thursday_start', 'thursday_end'),
        4: ('friday_start', 'friday_end'),
        5: ('saturday_start', 'saturday_end'),
        6: ('sunday_start', 'sunday_end')
    }
    
    if day_of_week not in day_mapping:
        return []
    
    start_attr, end_attr = day_mapping[day_of_week]
    start_time = getattr(doctor, start_attr)
    end_time = getattr(doctor, end_attr)
    
    if not start_time or not end_time:
        return []
    
    # Get existing appointments for this date
    existing_appointments = Appointment.query.filter_by(
        doctor_id=doctor.id,
        appointment_date=appointment_date,
        status='scheduled'
    ).all()
    
    booked_times = {apt.appointment_time for apt in existing_appointments}
    
    # Generate available slots
    available_slots = []
    current_time = datetime.combine(date.today(), start_time)
    end_datetime = datetime.combine(date.today(), end_time)
    
    while current_time < end_datetime:
        slot_time = current_time.time()
        if slot_time not in booked_times:
            available_slots.append(format_time(slot_time))
        current_time += timedelta(minutes=slot_duration)
    
    return available_slots

def get_appointment_priority_data(appointment):
    """Get priority calculation data for an appointment"""
    patient = appointment.patient
    patient_age = calculate_age(patient.user.date_of_birth)
    
    return {
        'appointment_type': appointment.appointment_type,
        'patient_age': patient_age,
        'appointment_date': appointment.appointment_date,
        'created_at': appointment.created_at.date()
    }

def create_default_specializations():
    """Create default medical specializations"""
    specializations = [
        "General Medicine", "Cardiology", "Dermatology", "Endocrinology",
        "Gastroenterology", "Hematology", "Infectious Disease", "Nephrology",
        "Neurology", "Oncology", "Ophthalmology", "Orthopedics",
        "Otolaryngology", "Pediatrics", "Psychiatry", "Pulmonology",
        "Radiology", "Rheumatology", "Urology", "Emergency Medicine",
        "Family Medicine", "Internal Medicine", "Obstetrics and Gynecology",
        "Anesthesiology", "Pathology", "Physical Medicine", "Plastic Surgery",
        "General Surgery"
    ]
    
    for spec_name in specializations:
        if not Specialization.query.filter_by(name=spec_name).first():
            specialization = Specialization(name=spec_name)
            db.session.add(specialization)
    
    db.session.commit()

def create_default_diseases():
    """Create default disease database"""
    diseases = [
        {
            "name": "Hypertension",
            "description": "High blood pressure",
            "symptoms": "Headache, dizziness, chest pain",
            "category": "Cardiovascular"
        },
        {
            "name": "Diabetes Mellitus",
            "description": "Blood sugar regulation disorder",
            "symptoms": "Excessive thirst, frequent urination, fatigue",
            "category": "Endocrine"
        },
        {
            "name": "Asthma",
            "description": "Chronic respiratory condition",
            "symptoms": "Wheezing, shortness of breath, chest tightness",
            "category": "Respiratory"
        },
        {
            "name": "Migraine",
            "description": "Severe recurring headaches",
            "symptoms": "Intense headache, nausea, light sensitivity",
            "category": "Neurological"
        },
        {
            "name": "Arthritis",
            "description": "Joint inflammation",
            "symptoms": "Joint pain, stiffness, swelling",
            "category": "Musculoskeletal"
        }
    ]
    
    for disease_data in diseases:
        if not Disease.query.filter_by(name=disease_data["name"]).first():
            disease = Disease(**disease_data)
            db.session.add(disease)
    
    db.session.commit()

def initialize_system_data():
    """Initialize system with default data"""
    create_default_specializations()
    create_default_diseases()
