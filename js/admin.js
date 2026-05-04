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
    window.location.href = "./index.html";
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
  list.innerHTML = "<p>Chargement...</p>";

  const usersSnap = await getDocs(collection(db, "users"));

  let html = "";

  usersSnap.forEach((userDoc) => {
    const user = userDoc.data();

    html += `
      <div class="vehicle-card">
        <h3>${user.pseudo} (${user.email})</h3>
        <p>Validé : <strong>${user.validated ? "Oui" : "Non"}</strong></p>

        <button class="validateBtn" data-id="${userDoc.id}">
          ${user.validated ? "Désactiver" : "Valider"}
        </button>

        <h3>Véhicules :</h3>
        <div id="vehicles-${userDoc.id}">Chargement...</div>
      </div>
    `;

    loadVehicles(userDoc.id);
  });

  list.innerHTML = html;

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
  container.innerHTML = "<p>Chargement...</p>";

  const snap = await getDocs(collection(db, "users", uid, "vehicles"));

  if (snap.empty) {
    container.innerHTML = "<p>Aucun véhicule</p>";
    return;
  }

  let html = "";

  snap.forEach(docu => {
    const v = docu.data();

    html += `
      <div class="vehicle-card">
        <h4>${v.name}</h4>
        <img src="${v.imageUrl}" data-uid="${uid}" data-id="${docu.id}">
        <p>Sorties : <strong>${v.sorties}</strong></p>
      </div>
    `;
  });

  container.innerHTML = html;

  // Double clic admin → sorties++
  container.querySelectorAll("img").forEach(img => {
    img.addEventListener("dblclick", () => incrementVehicle(uid, img.dataset.id));
  });
}


// ---------------------------------------------------------
// 🔥 ADMIN : INCRÉMENTER SORTIES D’UN VÉHICULE
// ---------------------------------------------------------
async function incrementVehicle(uid, vehicleId) {
  const ref = doc(db, "users", uid, "vehicles", vehicleId);
  const snap = await getDoc(ref);

  await updateDoc(ref, { sorties: snap.data().sorties + 1 });

  loadVehicles(uid);
}


// ---------------------------------------------------------
// 🔥 ADMIN : VALIDER / DÉSACTIVER UN UTILISATEUR
// ---------------------------------------------------------
async function toggleValidation(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  await updateDoc(ref, { validated: !snap.data().validated });

  loadUsers();
}
