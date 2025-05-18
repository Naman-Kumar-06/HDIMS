// Firebase configuration for HDIMS
const firebaseConfig = {
    apiKey: "FIREBASE_API_KEY",
    authDomain: "FIREBASE_PROJECT_ID.firebaseapp.com",
    projectId: "FIREBASE_PROJECT_ID",
    storageBucket: "FIREBASE_PROJECT_ID.appspot.com",
    appId: "FIREBASE_APP_ID"
};

// Export the configuration
function getFirebaseConfig() {
    return firebaseConfig;
}