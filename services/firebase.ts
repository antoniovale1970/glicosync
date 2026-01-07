
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE (CLOUD) ---
// Credenciais reais do projeto GlicoSync
const firebaseConfig = {
  apiKey: "AIzaSyDnc-y_xHDipFvWp6TQ27zv6b2Yi--qu48",
  authDomain: "glicosync.firebaseapp.com",
  projectId: "glicosync",
  storageBucket: "glicosync.firebasestorage.app",
  messagingSenderId: "343355495964",
  appId: "1:343355495964:web:4015bffe2578729458f1d9",
  measurementId: "G-M6D724XMGM"
};

// Inicialização segura com tipagem 'any' para evitar erros de compilação TS
let app: any;
let auth: any;
let db: any;
let isFirebaseConfigured = false;

try {
    // Check for critical missing config before initializing
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
        throw new Error("Missing Firebase Config");
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log("GlicoSync: Conectado ao Firebase com sucesso.");
} catch (e) {
    console.warn("Aviso: Firebase não inicializado. O aplicativo funcionará em modo local/offline.", e);
    // Permite que o app carregue sem quebrar, as funções que dependem do 'auth' ou 'db' devem checar sua existência antes de usar
}

export { auth, db, isFirebaseConfigured };
