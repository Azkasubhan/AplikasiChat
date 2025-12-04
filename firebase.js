import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { collection, getFirestore } from "firebase/firestore";

// Ganti dengan firebaseConfig Web App milikmu
const firebaseConfig = {
  apiKey: "AIzaSyCXKdYYszIl8wphYHU5K4_lBj_o_Z12cmk",
  authDomain: "aplikasichat-6f089.firebaseapp.com",
  projectId: "aplikasichat-6f089",
  storageBucket: "aplikasichat-6f089.firebasestorage.app",
  messagingSenderId: "79733432538",
  appId: "1:79733432538:web:88af9fba72486c4bf385e3",
  measurementId: "G-JSKN63V820"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

// collection default (sesuai contoh pada PDF)
const messagesCollection = collection(db, "messages");

export { app, auth, db, messagesCollection };
