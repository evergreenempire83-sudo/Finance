// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuSEqhLenwrEz-qrIn1drjAugy1YSkDlI",
  authDomain: "creators-portal-428c5.firebaseapp.com",
  projectId: "creators-portal-428c5",
  storageBucket: "creators-portal-428c5.firebasestorage.app",
  messagingSenderId: "499280036303",
  appId: "1:499280036303:web:b4d80d3b7fe1291381d2ba",
  measurementId: "G-CYWGD80FS5"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { app, auth, db, firebaseConfig };
}
