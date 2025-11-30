// FIX: Changed import to use module namespace to fix initialization error.
import * as firebaseApp from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEsrVasCMnh8pdTZwhi8SaxRMx5kF62oE",
  authDomain: "app-c71d8.firebaseapp.com",
  databaseURL: "https://app-c71d8-default-rtdb.firebaseio.com",
  projectId: "app-c71d8",
  storageBucket: "app-c71d8.appspot.com",
  messagingSenderId: "503361105354",
  appId: "1:503361105354:web:357b2bea7e1d298dab3333",
  measurementId: "G-G99KXE6F2D"
};

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);

// Get a reference to the auth service and the database service
export const auth = getAuth(app);
export const db = getDatabase(app);