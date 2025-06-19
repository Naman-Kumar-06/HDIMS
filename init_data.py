from datetime import date, time, datetime
from app import app, db
from models import User, Patient, Doctor, Appointment, MedicalRecord
from utils import generate_patient_id, generate_doctor_id, generate_appointment_id, generate_record_id, initialize_system_data

def create_test_users():
    """Create test users with different roles"""
    with app.app_context():
        # Initialize system data first
        initialize_system_data()
        
        # Create test patient
        if not User.query.filter_by(email='patient@hdims.com').first():
            patient_user = User(
                email='patient@hdims.com',
                role='patient',
                first_name='John',
                last_name='Doe',
                phone='555-0123',
                date_of_birth=date(1990, 5, 15),
                gender='Male',
                address='123 Main St, Anytown, USA',
                is_active=True
            )
            patient_user.set_password('patient123')
            db.session.add(patient_user)
            db.session.flush()
            
            # Create patient profile
            patient_profile = Patient(
                user_id=patient_user.id,
                patient_id=generate_patient_id(),
                blood_type='O+',
                allergies='None known',
                emergency_contact_name='Jane Doe',
                emergency_contact_phone='555-0124',
                insurance_provider='HealthCare Plus',
                insurance_number='HC123456789'
            )
            db.session.add(patient_profile)
        
        # Create test doctor
        if not User.query.filter_by(email='doctor@hdims.com').first():
            doctor_user = User(
                email='doctor@hdims.com',
                role='doctor',
                first_name='Sarah',
                last_name='Smith',
                phone='555-0125',
                date_of_birth=date(1985, 8, 20),
                gender='Female',
                address='456 Medical Blvd, Healthcare City, USA',
                is_active=True
            )
            doctor_user.set_password('doctor123')
            db.session.add(doctor_user)
            db.session.flush()
            
            # Create doctor profile
            doctor_profile = Doctor(
                user_id=doctor_user.id,
                doctor_id=generate_doctor_id(),
                specialization='General Medicine',
                license_number='MD123456',
                experience_years=10,
                education='MD from Harvard Medical School',
                consultation_fee=150.00,
                rating=4.8,
                total_reviews=45,
                # Working hours Monday to Friday
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
            db.session.add(doctor_profile)
        
        # Create another test doctor (Cardiologist)
        if not User.query.filter_by(email='cardio@hdims.com').first():
            cardio_user = User(
                email='cardio@hdims.com',
                role='doctor',
                first_name='Michael',
                last_name='Johnson',
                phone='555-0126',
                date_of_birth=date(1980, 3, 12),
                gender='Male',
                address='789 Heart St, Medical District, USA',
                is_active=True
            )
            cardio_user.set_password('cardio123')
            db.session.add(cardio_user)
            db.session.flush()
            
            cardio_profile = Doctor(
                user_id=cardio_user.id,
                doctor_id=generate_doctor_id(),
                specialization='Cardiology',
                license_number='MD789012',
                experience_years=15,
                education='MD from Johns Hopkins, Cardiology Fellowship',
                consultation_fee=250.00,
                rating=4.9,
                total_reviews=78,
                # Working hours Tuesday to Saturday
                tuesday_start=time(8, 0),
                tuesday_end=time(16, 0),
                wednesday_start=time(8, 0),
                wednesday_end=time(16, 0),
                thursday_start=time(8, 0),
                thursday_end=time(16, 0),
                friday_start=time(8, 0),
                friday_end=time(16, 0),
                saturday_start=time(9, 0),
                saturday_end=time(13, 0)
            )
            db.session.add(cardio_profile)
        
        # Create test admin
        if not User.query.filter_by(email='admin@hdims.com').first():
            admin_user = User(
                email='admin@hdims.com',
                role='admin',
                first_name='Admin',
                last_name='User',
                phone='555-0127',
                date_of_birth=date(1975, 12, 1),
                gender='Other',
                address='Admin Office, HDIMS Headquarters',
                is_active=True
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
        
        # Additional test patients
        test_patients = [
            {
                'email': 'alice@example.com',
                'first_name': 'Alice',
                'last_name': 'Wilson',
                'phone': '555-0201',
                'date_of_birth': date(1985, 7, 22),
                'gender': 'Female',
                'blood_type': 'A+',
                'allergies': 'Penicillin'
            },
            {
                'email': 'bob@example.com',
                'first_name': 'Bob',
                'last_name': 'Brown',
                'phone': '555-0202',
                'date_of_birth': date(1992, 11, 8),
                'gender': 'Male',
                'blood_type': 'B-',
                'allergies': 'None known'
            }
        ]
        
        for patient_data in test_patients:
            if not User.query.filter_by(email=patient_data['email']).first():
                user = User(
                    email=patient_data['email'],
                    role='patient',
                    first_name=patient_data['first_name'],
                    last_name=patient_data['last_name'],
                    phone=patient_data['phone'],
                    date_of_birth=patient_data['date_of_birth'],
                    gender=patient_data['gender'],
                    address='123 Test St, Test City, USA',
                    is_active=True
                )
                user.set_password('test123')
                db.session.add(user)
                db.session.flush()
                
                patient = Patient(
                    user_id=user.id,
                    patient_id=generate_patient_id(),
                    blood_type=patient_data['blood_type'],
                    allergies=patient_data['allergies'],
                    emergency_contact_name=f"Emergency Contact for {patient_data['first_name']}",
                    emergency_contact_phone='555-9999',
                    insurance_provider='Test Insurance',
                    insurance_number=f"TEST{user.id:06d}"
                )
                db.session.add(patient)
        
        # Additional test doctors
        test_doctors = [
            {
                'email': 'pediatrician@hdims.com',
                'first_name': 'Emily',
                'last_name': 'Davis',
                'specialization': 'Pediatrics',
                'license_number': 'MD345678',
                'experience_years': 8,
                'consultation_fee': 120.00
            },
            {
                'email': 'orthopedic@hdims.com',
                'first_name': 'David',
                'last_name': 'Miller',
                'specialization': 'Orthopedics',
                'license_number': 'MD456789',
                'experience_years': 12,
                'consultation_fee': 200.00
            }
        ]
        
        for doctor_data in test_doctors:
            if not User.query.filter_by(email=doctor_data['email']).first():
                user = User(
                    email=doctor_data['email'],
                    role='doctor',
                    first_name=doctor_data['first_name'],
                    last_name=doctor_data['last_name'],
                    phone='555-0300',
                    date_of_birth=date(1982, 6, 15),
                    gender='Other',
                    address='Medical Center, Healthcare District',
                    is_active=True
                )
                user.set_password('doctor123')
                db.session.add(user)
                db.session.flush()
                
                doctor = Doctor(
                    user_id=user.id,
                    doctor_id=generate_doctor_id(),
                    specialization=doctor_data['specialization'],
                    license_number=doctor_data['license_number'],
                    experience_years=doctor_data['experience_years'],
                    education=f"MD, {doctor_data['specialization']} Specialist",
                    consultation_fee=doctor_data['consultation_fee'],
                    rating=4.5,
                    total_reviews=25,
                    # Standard working hours
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
        
        db.session.commit()
        print("Test users created successfully!")

if __name__ == '__main__':
    create_test_users()
