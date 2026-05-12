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
  const goLoginBtn  = document.getElementById("goLoginBtn");

  if (loginBtn)    loginBtn.addEventListener("click", login);
  if (registerBtn) registerBtn.addEventListener("click", registerUser);

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
    // Création du compte Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Création du document Firestore
    await setDoc(doc(db, "users", user.uid), {
      pseudo: pseudo,
      email: email,
      role: "user",       // 🔥 rôle par défaut
      isAdmin: false,     // 🔥 simplifie les checks
      validated: false,   // 🔥 admin doit valider
      interventions: 0,
      createdAt: serverTimestamp()
    });

    alert("Inscription réussie ! Votre compte doit être validé par un administrateur.");
    window.location.href = "./login.html";

  } catch (error) {
    console.error("Erreur inscription :", error);
    alert("Erreur : " + error.message);
  }
}

// ---------------------------------------------------------
// 🔥 CONNEXION (bloque si non validé + redirection vers compteur)
// ---------------------------------------------------------
async function login() {
  const email    = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Merci de remplir tous les champs.");
    return;
  }

  try {
    // Connexion Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Récupération du document Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      alert("Erreur : utilisateur introuvable dans Firestore.");
      return;
    }

    const userData = userDoc.data();

    // Vérification validation admin
    if (!userData.validated) {
      alert("Votre compte n'a pas encore été validé par un administrateur.");
      return;
    }

    // 🔥 ADMIN OU UTILISATEUR NORMAL → direction compteur
    window.location.href = "./compteur.html";

  } catch (error) {
    console.error("Erreur connexion :", error);
    alert("Erreur de connexion : " + error.message);
  }
}


