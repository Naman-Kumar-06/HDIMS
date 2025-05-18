# Health Data Information Management System (HDIMS)

## Project Overview

The Health Data Information Management System (HDIMS) is a full-stack application designed to manage healthcare data efficiently while implementing advanced data structures and algorithms (DSA) concepts. This system supports multiple user roles (patients, doctors, administrators) with role-based access control and leverages Firebase Authentication for secure user management.

## Technologies Used

### Frontend
- **HTML/CSS/JavaScript**: Core web technologies for the user interface
- **Bootstrap 5**: For responsive design and components
- **Chart.js**: For data visualization of healthcare metrics
- **Firebase Web SDK**: For authentication services

### Backend
- **C++ Backend**: Core server implementation (in development)
- **Firebase Authentication**: For user authentication and management
- **REST API**: For communication between frontend and backend

### Data Structures & Algorithms (DSA) Implementations
1. **Priority Queue (Min-Heap)**: Used for appointment scheduling based on urgency levels
2. **Trie Data Structure**: For fast patient and disease name searches with autocomplete
3. **Graph (Adjacency List)**: For:
   - Disease spread tracking using Breadth-First Search (BFS)
   - Finding optimal doctor referral paths using Dijkstra's Algorithm
4. **Segment Tree**: For efficient hospital/doctor performance metrics over time ranges

## System Features

### Authentication & Authorization
- User login and registration via Firebase Authentication
- Role-based access control (Patient, Doctor, Administrator)
- Secure token validation and verification

### Patient Features
- View personal profile and medical history
- Book and manage appointments
- Track appointment status and history

### Doctor Features
- Manage daily appointment schedule
- View patient information and medical records
- Update appointment status and add notes
- Set availability and manage schedule

### Administrator Features
- Add and manage doctors in the system
- Generate performance reports and analytics
- Monitor system usage and metrics
- Manage user accounts

### DSA Implementations & Demo
- Interactive demonstrations of data structures and algorithms
- Visualization of healthcare data using advanced algorithms
- Performance analytics for doctors and hospitals

## System Architecture

```
+----------------+     +----------------+      +----------------+
|                |     |                |      |                |
|  Web Frontend  <----->  C++ Backend   <----->  Firebase Auth  |
|  (JavaScript)  |     |                |      |                |
+----------------+     +----------------+      +----------------+
                             |
                             v
                       +----------------+
                       |                |
                       |    Database    |
                       |                |
                       +----------------+
```

## Running the Project Locally

### Prerequisites
1. Web browser (Chrome, Firefox, Edge, etc.)
2. Firebase project with Web SDK enabled (for authentication)
3. Firebase project credentials (apiKey, projectId, appId)

### Step 1: Clone or Download the Project
Download the project files to your local computer.

### Step 2: Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firebase Authentication with Email/Password provider
3. Register a web application in your Firebase project
4. Get your Firebase configuration values:
   - `apiKey`
   - `projectId`
   - `appId`

### Step 3: Configure the Application
1. Open `index.html` in a text editor
2. Locate the Firebase configuration section:
   ```javascript
   const firebaseConfig = {
       apiKey: "FIREBASE_API_KEY",
       authDomain: "FIREBASE_PROJECT_ID.firebaseapp.com",
       projectId: "FIREBASE_PROJECT_ID",
       storageBucket: "FIREBASE_PROJECT_ID.appspot.com",
       appId: "FIREBASE_APP_ID"
   };
   ```
3. Replace the placeholder values with your actual Firebase configuration values

### Step 4: Set Up Local Web Server
You can use any of these methods to serve the application:

**Option 1: Using Python's built-in HTTP server**
```
# Navigate to the project directory
cd path/to/hdims

# If you have Python 3 installed
python -m http.server 5000

# If you have Python 2 installed
python -m SimpleHTTPServer 5000
```

**Option 2: Using Node.js and http-server**
```
# Install http-server globally if you haven't already
npm install -g http-server

# Navigate to the project directory
cd path/to/hdims

# Start the server
http-server -p 5000
```

**Option 3: Using VS Code Live Server Extension**
1. Install the "Live Server" extension in VS Code
2. Right-click on index.html and select "Open with Live Server"

### Step 5: Access the Application
Open your web browser and navigate to:
```
http://localhost:5000
```

### Step 6: Create Test Accounts
1. Register a new account in the application
2. Use different email addresses to create accounts for each role:
   - Patient
   - Doctor
   - Administrator

## Using the DSA Demo Features

The HDIMS includes a special page to demonstrate the advanced data structures and algorithms implemented in the system:

1. Navigate to `pages/dsa-demo.html` in your browser
2. Explore each DSA feature:
   - **Priority Queue**: See how appointments are prioritized by urgency
   - **Trie Search**: Experience fast patient search with autocomplete
   - **Graph Algorithms**: Track disease spread patterns using BFS
   - **Segment Tree**: Analyze doctor performance metrics over time ranges

## Future Enhancements

The HDIMS project is designed to be expandable with these planned enhancements:

1. **Complete C++ Backend Integration**: Finishing the C++ backend for production use
2. **Database Implementation**: Full integration with MySQL or another database system
3. **Mobile Application**: Development of companion mobile apps for patients and doctors
4. **Telemedicine Features**: Integration of video consultation capabilities
5. **AI Diagnostics**: Implementation of machine learning for preliminary diagnoses
6. **Blockchain Medical Records**: Enhanced security for patient data using blockchain

## Troubleshooting

### Firebase Authentication Issues
- Ensure you've enabled Email/Password authentication in Firebase Console
- Verify that your Firebase credentials are correct in the configuration
- Add your application domain to the authorized domains list in Firebase Auth Settings

### Application Not Loading
- Check browser console for JavaScript errors
- Ensure all files are properly downloaded and accessible
- Verify you're using a modern web browser with JavaScript enabled

### CORS Issues
- When running locally, use a web server as described in Step 4
- Loading the HTML files directly from the filesystem may cause CORS errors with Firebase

## Credits

This Health Data Information Management System (HDIMS) was developed using a combination of web technologies and advanced data structures and algorithms concepts. The implementation showcases the practical application of computer science fundamentals in healthcare management.