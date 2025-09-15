import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'studio-9919445440-fd888',
  appId: '1:1021475866247:web:4bc3404788011f013a5a22',
  storageBucket: 'studio-9919445440-fd888.firebasestorage.app',
  apiKey: 'AIzaSyBF5gx8oftyj4JQiNAnwbwGy6TfOFSem5A',
  authDomain: 'studio-9919445440-fd888.firebaseapp.com',
  messagingSenderId: '1021475866247',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
