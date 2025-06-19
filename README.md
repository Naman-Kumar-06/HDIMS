# HDIMS - Health Data Information Management System

## Overview

HDIMS (Health Data Information Management System) is a comprehensive web-based healthcare management platform built with Flask and PostgreSQL. The system features advanced data structures and algorithms to optimize patient care, appointment scheduling, and medical records management through intelligent search, priority queuing, and relationship mapping.

## Features

### 🏥 Multi-Role System
- **Patient Portal**: Registration, appointment booking, medical history
- **Doctor Interface**: Schedule management, patient care, medical records
- **Admin Dashboard**: System analytics, user management, oversight

### 🔍 Advanced Search & Data Structures
- **Trie-based Search**: Efficient autocomplete for patients, doctors, and diseases
- **Priority Queue**: Smart appointment scheduling based on urgency and patient profile
- **Graph Algorithms**: Doctor referral network and specialization mapping
- **Segment Trees**: Range query analytics for system metrics

### 📅 Appointment Management
- Real-time doctor availability checking
- Priority-based scheduling system
- Working hours management
- Appointment status tracking

### 📊 Analytics & Reporting
- System performance metrics
- Patient satisfaction tracking
- Revenue and usage analytics
- Interactive charts and visualizations

## Technology Stack

- **Backend**: Flask (Python 3.11)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Frontend**: Bootstrap 5.3.0, Font Awesome 6.4.0
- **Authentication**: Flask-Login
- **Deployment**: Gunicorn WSGI server

## Prerequisites

Before running HDIMS locally, ensure you have:

- Python 3.11 or higher
- PostgreSQL 12 or higher
- pip (Python package installer)
- Git

## Local Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hdims
```

### 2. Set Up Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up PostgreSQL Database

```bash
# Create database (replace with your PostgreSQL credentials)
createdb hdims_db

# Or using PostgreSQL command line:
psql -U postgres
CREATE DATABASE hdims_db;
\q
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/hdims_db

# Security
SESSION_SECRET=your-secret-key-here-change-in-production

# Optional: Flask Environment
FLASK_ENV=development
FLASK_DEBUG=True
```

### 6. Initialize Database

```python
# Run Python shell
python

# Initialize database tables
from app import app, db
with app.app_context():
    db.create_all()
    
# Initialize default data (optional)
from init_data import create_test_users
create_test_users()
```

### 7. Run the Application

```bash
# Using Flask development server
python main.py

# Or using Gunicorn (production-like)
gunicorn --bind 0.0.0.0:5000 --reload main:app
```

The application will be available at `http://localhost:5000`

## Default Test Accounts

The system comes with pre-configured test accounts:

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@hdims.com | patient123 |
| Doctor | doctor@hdims.com | doctor123 |
| Admin | admin@hdims.com | admin123 |

## User Registration

### Patient Registration
- Visit `/register` or click "Register as Patient" on login page
- Fill in personal and medical information
- Account activated immediately

### Doctor Registration
- Visit `/doctor/register` or click "Register as Doctor" on login page
- Complete professional information including:
  - Medical specialization
  - License number
  - Years of experience
  - Working hours schedule
- Account activated immediately

### Admin Registration
- Visit `/admin/register` or click "Register as Admin" on login page
- Requires admin authorization code: `HDIMS_ADMIN_2025`
- Complete personal information
- Account activated immediately

## Key Functionalities

### For Patients
1. **Dashboard**: View appointments, medical history, health metrics
2. **Book Appointments**: Search doctors by specialization, view availability
3. **Medical Records**: Access complete medical history
4. **Profile Management**: Update personal and medical information

### For Doctors
1. **Dashboard**: View schedule, pending appointments, patient summaries
2. **Schedule Management**: Set working hours, view daily/weekly schedule
3. **Patient Care**: Complete appointments, add medical records
4. **Patient Search**: Find patients using advanced search

### For Administrators
1. **System Analytics**: Monitor usage, performance, revenue metrics
2. **User Management**: Activate/deactivate users, view system users
3. **Reports**: Generate system reports and analytics
4. **Data Oversight**: Monitor system health and performance

## API Endpoints

### Search APIs
- `GET /api/search/patients?q=<query>` - Search patients
- `GET /api/search/doctors?q=<query>` - Search doctors  
- `GET /api/search/diseases?q=<query>` - Search diseases

### Data APIs
- `GET /api/doctors/<specialization>` - Get doctors by specialization
- `GET /api/available-slots/<doctor_id>` - Get available appointment slots

## Database Schema

### Core Tables
- `users` - Base user information and authentication
- `patients` - Patient-specific medical information
- `doctors` - Doctor profiles and professional details
- `appointments` - Appointment scheduling and management
- `medical_records` - Patient medical history and treatment records

### Supporting Tables
- `specializations` - Medical specializations
- `diseases` - Disease database for search and categorization
- `doctor_referrals` - Doctor referral network
- `system_metrics` - System performance analytics

## Development

### Project Structure
```
hdims/
├── app.py              # Flask application setup
├── main.py             # Application entry point
├── models.py           # Database models
├── routes.py           # Route handlers
├── data_structures.py  # Advanced data structures
├── utils.py            # Utility functions
├── init_data.py        # Database initialization
├── static/             # Static assets (CSS, JS, images)
├── templates/          # HTML templates
└── requirements.txt    # Python dependencies
```

### Running Tests
```bash
# Install test dependencies
pip install pytest

# Run tests
pytest
```

### Code Style
The project follows PEP 8 style guidelines. Use tools like `flake8` or `black` for code formatting.

## Deployment

### Production Deployment
1. Set `FLASK_ENV=production`
2. Use strong `SESSION_SECRET`
3. Configure production PostgreSQL database
4. Use Gunicorn with multiple workers
5. Set up reverse proxy (Nginx)
6. Enable SSL/TLS certificates

### Environment Variables for Production
```env
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/hdims_prod
SESSION_SECRET=strong-random-secret-key
FLASK_ENV=production
```

## Security Features

- Password hashing using Werkzeug
- Session-based authentication
- CSRF protection
- SQL injection prevention via SQLAlchemy ORM
- Input validation and sanitization
- Role-based access control

## Performance Optimizations

- Database connection pooling
- Efficient search using Trie data structures
- Lazy loading for large datasets
- Query optimization with proper indexing
- Client-side caching for static assets

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL environment variable
   - Ensure database exists and user has permissions

2. **Import Errors**
   - Activate virtual environment
   - Install all dependencies from requirements.txt

3. **Template Not Found**
   - Ensure templates directory exists
   - Check template file names match route handlers

4. **Session Issues**
   - Set SESSION_SECRET environment variable
   - Clear browser cookies and restart application

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## Changelog

### Version 1.0.0 (June 2025)
- Initial release
- Multi-role authentication system
- Advanced data structures implementation
- Patient and doctor management
- Appointment scheduling system
- Medical records management
- Admin analytics dashboard
- Comprehensive search functionality