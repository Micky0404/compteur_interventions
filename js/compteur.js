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

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Erreur : utilisateur introuvable.");
    auth.signOut();
    return;
  }

  const data = snap.data();

  // Affichage pseudo
  const pseudoSpan = document.getElementById("pseudo");
  if (pseudoSpan) pseudoSpan.textContent = data.pseudo;

  // Afficher bouton admin
  if (data.role === "admin") {
    const adminBtn = document.getElementById("admin-btn");
    if (adminBtn) adminBtn.style.display = "block";
  }

  loadVehicles();
});


// ---------------------------------------------------------
// 🔥 CHARGER LES VÉHICULES
// ---------------------------------------------------------
async function loadVehicles() {
  const user = auth.currentUser;
  const list = document.getElementById("vehicleList");

  if (!list) return;

  list.innerHTML = "";

  const ref = collection(db, "users", user.uid, "vehicles");
  const snap = await getDocs(ref);

  snap.forEach(docu => {
    const v = docu.data();

    const card = document.createElement("div");
    card.className = "vehicle-card";

    card.innerHTML = `
      <h3>${v.name}</h3>
      <img src="${v.imageUrl}" data-id="${docu.id}">
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

  // 🔥 Listener pour bouton Modifier
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });
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

  const user = auth.currentUser;
  const ref = doc(db, "users", user.uid, "vehicles", vehicleToEdit);

  await updateDoc(ref, { name: newName });

  document.getElementById("editModal").style.display = "none";
  document.getElementById("editVehicleName").value = "";

  loadVehicles();
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
async function incrementVehicle(id) {
  const user = auth.currentUser;
  const ref = doc(db, "users", user.uid, "vehicles", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const newValue = snap.data().sorties + 1;

  await updateDoc(ref, { sorties: newValue });

  await addDoc(collection(db, "users", user.uid, "history"), {
    timestamp: serverTimestamp(),
    action: "+1 sortie",
    vehicleId: id,
    vehicleName: snap.data().name
  });

  loadVehicles();
}


// ---------------------------------------------------------
// ❌ SUPPRIMER UN VÉHICULE
// ---------------------------------------------------------
async function deleteVehicle(id) {
  if (!confirm("Supprimer ce véhicule ?")) return;

  const user = auth.currentUser;
  await deleteDoc(doc(db, "users", user.uid, "vehicles", id));

  loadVehicles();
}


// ---------------------------------------------------------
// 🔥 CONVERTIR IMAGE → BASE64
// ---------------------------------------------------------
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


// ---------------------------------------------------------
// 🔥 DÉCONNEXION
// ---------------------------------------------------------
const logoutBtn = document.querySelector(".logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    window.location.href = "./login.html";
  });
}
