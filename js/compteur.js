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

    // 🔥 Redirection admin → compteur.html (comme demandé)
    if (data.role === "admin" || data.isAdmin === true) {
      console.log("Admin détecté → accès compteur OK");
    }

    // Affichage pseudo
    const pseudoSpan = document.getElementById("pseudo");
    if (pseudoSpan) pseudoSpan.textContent = data.pseudo;

    // Afficher bouton admin
    if (data.role === "admin" || data.isAdmin === true) {
      const adminBtn = document.getElementById("admin-btn");
      if (adminBtn) adminBtn.style.display = "block";
    }

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

    document.getElementById("editModal").style.display = "none";
    document.getElementById("editVehicleName").value = "";

    loadVehicles();

  } catch (error) {
    console.error("Erreur modification véhicule :", error);
  }
});


// ---------------------------------------------------------
// 🔥 AJOUT VEHICULE
// ---------------------------------------------------------
const addVehicleBtn = document.getElementById("addVehicleBtn");
const saveVehicleBtn = document.getElementById("saveVehicleBtn");

if (addVehicleBtn) {
  addVehicleBtn.addEventListener("click", () => {
    document.getElementById("vehicleModal").style.display = "flex";
  });
}

if (saveVehicleBtn) {
  saveVehicleBtn.addEventListener("click", saveVehicle);
}

async function saveVehicle() {
  const name = document.getElementById("vehicleName").value.trim();
  const file = window.capturedPhoto || document.getElementById("uploadImage").files[0];

  if (!name || !file) {
    alert("Nom + image obligatoires");
    return;
  }

  try {
    const base64 = await toBase64(file);
    const user = auth.currentUser;

    await addDoc(collection(db, "users", user.uid, "vehicles"), {
      name,
      imageUrl: base64,
      sorties: 0,
      createdAt: serverTimestamp()
    });

    window.capturedPhoto = null;
    document.getElementById("photoPreview").style.display = "none";

    document.getElementById("vehicleModal").style.display = "none";
    loadVehicles();

  } catch (error) {
    console.error("Erreur ajout véhicule :", error);
  }
}


// ---------------------------------------------------------
// 📸 CAMÉRA
// ---------------------------------------------------------
const takePhotoBtn = document.getElementById("takePhotoBtn");
const cameraInput = document.getElementById("cameraInput");
const photoPreview = document.getElementById("photoPreview");

if (takePhotoBtn) {
  takePhotoBtn.addEventListener("click", () => cameraInput.click());
}

if (cameraInput) {
  cameraInput.addEventListener("change", () => {
    const file = cameraInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      photoPreview.src = reader.result;
      photoPreview.style.display = "block";
    };
    reader.readAsDataURL(file);

    window.capturedPhoto = file;
  });
}


// ---------------------------------------------------------
// 🔥 INCRÉMENTER SORTIES + HISTORIQUE
// ---------------------------------------------------------
async function incrementVehicle(vehicleId) {
  try {
    const user = auth.currentUser;
    const ref = doc(db, "users", user.uid, "vehicles", vehicleId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const current = snap.data().sorties;

    await updateDoc(ref, {
      sorties: current + 1
    });

    loadVehicles();

  } catch (error) {
    console.error("Erreur increment :", error);
  }
}


// ---------------------------------------------------------
// 🔥 SUPPRIMER UN VÉHICULE
// ---------------------------------------------------------
async function deleteVehicle(id) {
  if (!confirm("Supprimer ce véhicule ?")) return;

  try {
    const user = auth.currentUser;
    await deleteDoc(doc(db, "users", user.uid, "vehicles", id));

    loadVehicles();

  } catch (error) {
    console.error("Erreur suppression véhicule :", error);
  }
}


// ---------------------------------------------------------
// 🔧 BASE64
// ---------------------------------------------------------
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve
