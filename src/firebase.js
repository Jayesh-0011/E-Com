// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🧠 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCUb0O6bqnlDcso0SoRlRFIcjUHCUkRIjA",
  authDomain: "oops-project-ed537.firebaseapp.com",
  projectId: "oops-project-ed537",
  storageBucket: "oops-project-ed537.firebasestorage.app",
  messagingSenderId: "800048893771",
  appId: "1:800048893771:web:bc8d1306f214047bd4a2ce",
};

// ✅ Prevent re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ✅ Export Recaptcha & Phone Auth
export { RecaptchaVerifier, signInWithPhoneNumber };

export default app;
