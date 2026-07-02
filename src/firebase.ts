import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCBpS-rnU0bmjHQnhXV9Hi0LcQADkehzmY",
  authDomain: "gen-lang-client-0692854151.firebaseapp.com",
  projectId: "gen-lang-client-0692854151",
  storageBucket: "gen-lang-client-0692854151.firebasestorage.app",
  messagingSenderId: "946085995121",
  appId: "1:946085995121:web:afdf35ab97c4178f7231d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = getFirestore(app, "ai-studio-pos-99ab221e-707a-4d18-b5c4-26efb74975fd");
