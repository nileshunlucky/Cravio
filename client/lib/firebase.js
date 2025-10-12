// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBgLqnARW4Fgc4Pw3uy7JKInAGQO9IRQEs",
    authDomain: "auraiser.firebaseapp.com",
    projectId: "auraiser",
    storageBucket: "auraiser.firebasestorage.app",
    messagingSenderId: "12803359437",
    appId: "1:12803359437:web:675742f426c434c8289f84",
    measurementId: "G-LFPDSLEX0R"
  };

// Prevent initializing more than once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
