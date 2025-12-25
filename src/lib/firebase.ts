import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // NOVO: Importação para Autenticação

const firebaseConfig = {
    apiKey: "AIzaSyBvFM13K0XadCnAHdHE0C5GtA2TH5DaqLg",
    authDomain: "familias-church.firebaseapp.com",
    projectId: "familias-church",
    storageBucket: "familias-church.firebasestorage.app",
    messagingSenderId: "764183777206",
    appId: "1:764183777206:web:758e4f04ee24b86229bb17",
    measurementId: "G-VHWLCPM3FR"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // NOVO: Exportação para o sistema de Login