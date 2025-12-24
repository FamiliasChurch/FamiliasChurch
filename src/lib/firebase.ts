import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBvFM13K0XadCnAHdHE0C5GtA2TH5DaqLg",
    authDomain: "familias-church.firebaseapp.com",
    projectId: "familias-church",
    storageBucket: "familias-church.firebasestorage.app",
    messagingSenderId: "764183777206",
    appId: "1:764183777206:web:758e4f04ee24b86229bb17",
    measurementId: "G-VHWLCPM3FR"
};

// Inicializa o Firebase e o Banco de Dados (Firestore)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);