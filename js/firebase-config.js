// ---------------------------------------------------------
// 🔥 CONFIGURATION FIREBASE (GITHUB PAGES COMPATIBLE)
// ---------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---------------------------------------------------------
// 🔥 CONFIG DE TON PROJET
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCfOwjVhiVm9wyR3RTRzOz-15q8ojDESLQ",
  authDomain: "compteur-d-interventions-80d5e.firebaseapp.com",
  projectId: "compteur-d-interventions-80d5e",
  storageBucket: "compteur-d-interventions-80d5e.firebasestorage.app",
  messagingSenderId: "984885064903",
  appId: "1:984885064903:web:f971697b57d82f28647ae2"
};

// ---------------------------------------------------------
// 🔥 INITIALISATION
// ---------------------------------------------------------
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
