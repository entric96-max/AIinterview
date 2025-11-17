// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuiZHU3m2un_wWQH4ztefffUWKjhFMOXc",
  authDomain: "aiinterview-12f78.firebaseapp.com",
  projectId: "aiinterview-12f78",
  storageBucket: "aiinterview-12f78.firebasestorage.app",
  messagingSenderId: "962054449606",
  appId: "1:962054449606:web:e597a18d9ed37fdd772ac7",
  measurementId: "G-C9LBSJPV78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
