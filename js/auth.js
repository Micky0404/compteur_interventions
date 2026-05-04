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
// 🔥 INSCRIPTION (avec validation admin)
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

    // 🔥 Création Firestore avec validation désactivée
    await setDoc(doc(db, "users", user.uid), {
      pseudo: pseudo,
      email: email,
      role: "user",
      validated: false,   // 🔥 L’admin doit valider
      interventions: 0,
      createdAt: serverTimestamp()
    });

    alert("Inscription réussie ! Votre compte doit être validé par un administrateur.");
    window.location.href = "./login.html";

  } catch (error) {
    alert("Erreur : " + error.message);
  }
}



// ---------------------------------------------------------
// 🔥 CONNEXION (bloque si non validé)
// ---------------------------------------------------------
async function login() {
  const email    = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!
