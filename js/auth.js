console.log("AUTH.JS CHARGÉ !");

// ---------------------------------------------------------
// 🔥 IMPORTS FIREBASE
// ---------------------------------------------------------
import { auth, db } from "./firebase-config.js";

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ---------------------------------------------------------
// 🔥 LISTENERS DOM
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn    = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");

  if (loginBtn) loginBtn.addEventListener("click", login);
  if (registerBtn) registerBtn.addEventListener("click", registerUser);

  // 🔥 Bouton "Déjà un compte ? Se connecter"
  const goLoginBtn = document.getElementById("goLoginBtn");
  if (goLoginBtn) {
    goLoginBtn.addEventListener("click", () => {
      window.location.href = "./login.html";
    });
  }
});


// ---------------------------------------------------------
// 🔥 INSCRIPTION
// ---------------------------------------------------------
async function registerUser() {
  const pseudo   = document.getElementById("pseudo")?.value.trim();
  const email    = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!pseudo || !email || !password) {
    alert("Merci de remplir tous les champs.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      pseudo: pseudo,
      email: email,
      role: "user",
      validated: false,
      interventions: 0,
      createdAt: serverTimestamp()
    });

    window.location.href = "./login.html";

  } catch (error) {
    alert("Erreur : " + error.message);
  }
}


// ---------------------------------------------------------
// 🔥 CONNEXION
// ---------------------------------------------------------
async function login() {
  const email    = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Merci de remplir tous les champs.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const ref  = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Erreur : utilisateur introuvable dans Firestore.");
      return;
    }

    window.location.href = "./compteur.html";

  } catch (error) {
    alert("Erreur : " + error.message);
  }
}
