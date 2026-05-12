import { auth, db } from "./firebase-config.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ---------------------------------------------------------
// 🔥 CHARGEMENT UTILISATEUR
// ---------------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Erreur : utilisateur introuvable.");
      await auth.signOut();
      return;
    }

    const data = snap.data();

    // 🔥 Bloquer si non validé
    if (!data.validated) {
      alert("Votre compte n'est pas encore validé.");
      await auth.signOut();
      return;
    }

    // 🔥 Admin détecté
    if (data.role === "admin" || data.isAdmin === true) {
      console.log("Admin détecté → accès compteur OK");
      const adminBtn = document.getElementById("admin-btn");
      if (adminBtn) adminBtn.style.display = "block";
    }

    // Affichage pseudo
    const pseudoSpan = document.getElementById("pseudo");
    if (pseudoSpan) pseudoSpan.textContent = data.pseudo;

    loadVehicles();

  } catch (error) {
    console.error("Erreur chargement utilisateur :", error);
    alert("Erreur interne.");
  }
});


// ---------------------------------------------------------
// 🔥 CHARGER LES VÉHICULES
// ---------------------------------------------------------
async function loadVehicles() {
  const user = auth.currentUser;
  const list = document.getElementById("vehicleList");

  if (!list) return;

  list.innerHTML = "<p>Chargement...</p>";

  try {
    const ref = collection(db, "users", user.uid, "vehicles");
    const snap = await getDocs(ref);

    list.innerHTML = "";

    snap.forEach(docu => {
      const v = docu.data();

      const card = document.createElement("div");
      card.className = "vehicle-card";

      card.innerHTML = `
        <h3>${v.name}</h3>
        <img src="${v.imageUrl || ""}" data-id="${docu.id}">
        <p>Sorties : <strong>${v.sorties}</strong></p>

        <button class="add-sortie-btn" data-id="${docu.id}">+1 sortie</button>
        <button class="edit-btn" data-id="${docu.id}">Modifier</button>
        <button class="delete-vehicle-btn" data-id="${docu.id}">Supprimer</button>
      `;

      list.appendChild(card);
    });

    // Listeners
    document.querySelectorAll(".add-sortie-btn").forEach(btn => {
      btn.addEventListener("click", () => incrementVehicle(btn.dataset.id));
    });

    document.querySelectorAll(".delete-vehicle-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteVehicle(btn.dataset.id));
    });

    document.querySelectorAll(".vehicle-card img").forEach(img => {
      img.addEventListener("dblclick", () => incrementVehicle(img.dataset.id));
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });

  } catch (error) {
    console.error("Erreur chargement véhicules :", error);
    list.innerHTML = "<p>Erreur lors du chargement.</p>";
  }
}


// ---------------------------------------------------------
// 🔥 MODIFIER LE NOM D’UN VÉHICULE
// ---------------------------------------------------------
let vehicleToEdit = null;

function openEditModal(id) {
  vehicleToEdit = id;
  document.getElementById("editModal").style.display = "flex";
}

document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const newName = document.getElementById("editVehicleName").value.trim();
  if (newName === "") return;

  try {
    const user = auth.currentUser;
    const ref = doc(db, "users", user.uid, "vehicles", vehicleToEdit);

    await updateDoc(ref, { name: newName });

    document.getElement
