// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXbwDTCTpjlEM4rKSloTWmXvGuy57fGKM",
  authDomain: "studio-2794072808-255ab.firebaseapp.com",
  projectId: "studio-2794072808-255ab",
  storageBucket: "studio-2794072808-255ab.firebasestorage.app",
  messagingSenderId: "625308181510",
  appId: "1:625308181510:web:6e72803905e41a9b238f87"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
