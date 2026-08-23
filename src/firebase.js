import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- 1. استيراد الـ storage

const firebaseConfig = {
  apiKey: "AIzaSyAtQvcKuni_PW4kjDOY21Fa6tfDRVT13PQ",
  authDomain: "kayan-c3918.firebaseapp.com",
  projectId: "kayan-c3918",
  storageBucket: "kayan-c3918.firebasestorage.app",
  messagingSenderId: "116296130208",
  appId: "1:116296130208:web:c7f724af32ba40b0eef3c5",
};

// تهيئة الفايربيز
const app = initializeApp(firebaseConfig);

// تصدير الأدوات
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- 2. تصدير الـ storage
