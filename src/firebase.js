import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBbKSHcKDrFFh6ZkME6pO7HI_0CEF3ESqg",
  authDomain: "studygram-8e318.firebaseapp.com",
  projectId: "studygram-8e318",
  storageBucket: "studygram-8e318.firebasestorage.app",
  messagingSenderId: "770530559860",
  appId: "1:770530559860:web:912907387609e0a1588e21",
  measurementId: "G-KY0BJWD7KC",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);