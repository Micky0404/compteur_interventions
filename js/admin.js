import { auth, db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ---------------------------------------------------------
// 🔥 VÉRIFIER QUE L’UTILISATEUR EST ADMIN
// ---------------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists() || snap.data().role !== "admin") {
    alert("Accès refusé.");
    window.location.href = "./index.html";
    return;
  }

  loadUsers();
});


// ---------------------------------------------------------
// 🔥 CHARGER TOUS LES UTILISATEURS
// ---------------------------------------------------------
async function loadUsers() {
  const list = document.getElementById("userList");
  list.innerHTML = "";

  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);

  usersSnap.forEach(async (userDoc) => {
    const user = userDoc.data();

    // Carte utilisateur premium
    let html = `
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

    list.innerHTML += html;

    loadVehicles(userDoc.id);
  });

  // Boutons valider/désactiver
  setTimeout(() => {
    document.querySelectorAll(".validateBtn").forEach(btn => {
      btn.addEventListener("click", () => toggleValidation(btn.dataset.id));
    });
  }, 500);
}


// ---------------------------------------------------------
// 🔥 CHARGER LES VÉHICULES D’UN UTILISATEUR
// ---------------------------------------------------------
async function loadVehicles(uid) {
  const container = document.getElementById(`vehicles-${uid}`);
  container.innerHTML = "";

  const ref = collection(db, "users", uid, "vehicles");
  const snap = await getDocs(ref);

  if (snap.empty) {
    container.innerHTML = "<p>Aucun véhicule</p>";
    return;
  }

  snap.forEach(docu => {
    const v = docu.data();

    container.innerHTML += `
      <div class="vehicle-card">
        <h4>${v.name}</h4>
        <img src="${v.imageUrl}" data-uid="${uid}" data-id="${docu.id}">
        <p>Sorties : <strong>${v.sorties}</strong></p>
      </div>
    `;
  });

  // Double clic admin → sorties++
  document.querySelectorAll(`#vehicles-${uid} img`).forEach(img => {
    img.addEventListener("dblclick", () => incrementVehicle(uid, img.dataset.id));
  });
}


// ---------------------------------------------------------
// 🔥 ADMIN : INCRÉMENTER SORTIES D’UN VÉHICULE
// ---------------------------------------------------------
async function incrementVehicle(uid, vehicleId) {
  const ref = doc(db, "users", uid, "vehicles", vehicleId);
  const snap = await getDoc(ref);

  const newValue = snap.data().sorties + 1;

  await updateDoc(ref, { sorties: newValue });

  loadVehicles(uid);
}


// ---------------------------------------------------------
// 🔥 ADMIN : VALIDER / DÉSACTIVER UN UTILISATEUR
// ---------------------------------------------------------
async function toggleValidation(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  const newValue = !snap.data().validated;

  await updateDoc(ref, { validated: newValue });

  loadUsers();
}
