console.log("ADMIN.JS CHARGÉ !");

// ---------------------------------------------------------
// 🔥 IMPORTS FIREBASE
// ---------------------------------------------------------
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ---------------------------------------------------------
// 🔒 PROTECTION ADMIN
// ---------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Erreur : utilisateur introuvable.");
    window.location.href = "./login.html";
    return;
  }

  const data = snap.data();

  if (data.role !== "admin") {
    alert("Accès refusé.");
    window.location.href = "./compteur.html";
    return;
  }

  console.log("Admin connecté :", data.pseudo);

  loadUsers();
});


// ---------------------------------------------------------
// 🔥 CHARGER TOUS LES UTILISATEURS
// ---------------------------------------------------------
async function loadUsers() {
  const list = document.getElementById("userList");
  if (!list) return;

  list.innerHTML = "<p>Chargement...</p>";

  const usersSnap = await getDocs(collection(db, "users"));

  list.innerHTML = ""; // reset propre

  usersSnap.forEach((userDoc) => {
    const user = userDoc.data();

    const card = document.createElement("div");
    card.className = "vehicle-card";

    card.innerHTML = `
      <h3>${user.pseudo} (${user.email})</h3>
      <p>Validé : 
        <strong style="color:${user.validated ? "lime" : "red"};">
          ${user.validated ? "Oui" : "Non"}
        </strong>
      </p>

      <button class="validateBtn" data-id="${userDoc.id}">
        ${user.validated ? "Désactiver" : "Valider"}
      </button>

      <h3>Véhicules :</h3>
      <div id="vehicles-${userDoc.id}">Chargement...</div>
    `;

    list.appendChild(card);

    loadVehicles(userDoc.id);
  });

  // Activation des boutons valider/désactiver
  document.querySelectorAll(".validateBtn").forEach(btn => {
    btn.addEventListener("click", () => toggleValidation(btn.dataset.id));
  });
}


// ---------------------------------------------------------
// 🔥 CHARGER LES VÉHICULES D’UN UTILISATEUR
// ---------------------------------------------------------
async function loadVehicles(uid) {
  const container = document.getElementById(`vehicles-${uid}`);
  if (!container) return;

  container.innerHTML = "<p>Chargement...</p>";

  const snap = await getDocs(collection(db, "users", uid, "vehicles"));

  if (snap.empty) {
    container.innerHTML = "<p>Aucun véhicule</p>";
    return;
  }

  container.innerHTML = ""; // reset propre

  snap.forEach(docu => {
    const v = docu.data();

    const card = document.createElement("div");
    card.className = "vehicle-card";

    card.innerHTML = `
      <h4>${v.name}</h4>
      <img src="${v.imageUrl}" data-uid="${uid}" data-id="${docu.id}">
      <p>Sorties : <strong>${v.sorties}</strong></p>
    `;

    container.appendChild(card);
  });

  // Double clic admin → sorties++
  container.querySelectorAll("img").forEach(img => {
    img.addEventListener("dblclick", () => incrementVehicle(uid, img.dataset.id));
  });
}


// ---------------------------------------------------------
// 🔥 ADMIN : INCRÉMENTER SORTIES D’UN VÉHICULE
// ---------------------------------------------------------
async function incrementVehicle(uid, vehicleId) {
  const ref = doc(db, "users",
