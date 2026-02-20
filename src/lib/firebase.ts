import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBvFM13K0XadCnAHdHE0C5GtA2TH5DaqLg",
    authDomain: "familias-church.firebaseapp.com",
    projectId: "familias-church",
    storageBucket: "familias-church.firebasestorage.app",
    messagingSenderId: "764183777206",
    appId: "1:764183777206:web:758e4f04ee24b86229bb17",
    measurementId: "G-VHWLCPM3FR"
};

const app = initializeApp(firebaseConfig);

// Banco de dados com persistência offline (Fundamental para o Encontro)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth = getAuth(app); 
export const storage = getStorage(app);
export const messaging = getMessaging(app);