console.log("COMPTEUR.JS CHARGÉ !");

// ---------------------------------------------------------
// 🔥 IMPORTS FIREBASE
// ---------------------------------------------------------
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ---------------------------------------------------------
// 🔥 VARIABLES DOM
// ---------------------------------------------------------
const vehicleList = document.getElementById("vehicleList");
const addModal = document.getElementById("addModal");
const editModal = document.getElementById("editModal");

const addVehicleBtn = document.getElementById("addVehicleBtn");
const saveVehicleBtn = document.getElementById("saveVehicleBtn");
const closeAddModal = document.getElementById("closeAddModal");

const saveEditBtn = document.getElementById("saveEditBtn");
const closeEditModal = document.getElementById("closeEditModal");

const openCameraBtn = document.getElementById("openCameraBtn");
const cameraPreview = document.getElementById("cameraPreview");

const imageFile = document.getElementById("imageFile");
const editImageFile = document.getElementById("editImageFile");

let currentEditId = null;
let cameraStream = null;
let capturedImage = null;
let newEditedImage = null;
let userId = null;
let isAdmin = false;


// ---------------------------------------------------------
// 🔥 UPLOAD FICHIER IMAGE (AJOUT)
// ---------------------------------------------------------
imageFile.addEventListener("change", () => {
  const file = imageFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    capturedImage = e.target.result;
  };
  reader.readAsDataURL(file);
});


// ---------------------------------------------------------
// 🔥 UPLOAD FICHIER IMAGE (MODIFICATION)
// ---------------------------------------------------------
editImageFile.addEventListener("change", () => {
  const file = editImageFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    newEditedImage = e.target.result;
  };
  reader.readAsDataURL(file);
});


// ---------------------------------------------------------
// 🔥 AUTHENTIFICATION + SÉCURITÉ
// ---------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  userId = user.uid;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Erreur : utilisateur introuvable.");
    await signOut(auth);
    return;
  }

  const data = snap.data();

  if (!data.validated) {
    alert("Votre compte n'est pas encore validé.");
    await signOut(auth);
    return;
  }

  if (data.role === "admin" || data.isAdmin === true) {
    isAdmin = true;
    document.getElementById("admin-btn").style.display = "block";
  }

  document.getElementById("user-title").textContent = `Véhicules de ${data.pseudo}`;

  loadVehicles();
});


// ---------------------------------------------------------
// 🔥 CHARGER LES VÉHICULES
// ---------------------------------------------------------
async function loadVehicles() {
  vehicleList.innerHTML = "<p>Chargement...</p>";

  const snap = await getDocs(collection(db, "users", userId, "vehicles"));

  if (snap.empty) {
    vehicleList.innerHTML = "<p>Aucun véhicule pour le moment.</p>";
    return;
  }

  vehicleList.innerHTML = "";

  snap.forEach((docu) => {
    const v = docu.data();

    const card = document.createElement("div");
    card.className = "vehicle-card";

    card.innerHTML = `
      <h3>${v.name}</h3>
      <img src="${v.imageUrl}" data-id="${docu.id}">
      <p>Sorties : <strong>${v.sorties}</strong></p>

      <button class="btn-primary sortieBtn" data-id="${docu.id}">+1 sortie</button>
      <button class="btn-secondary editBtn" data-id="${docu.id}" data-name="${v.name}">Modifier</button>
      <button class="btn-danger deleteBtn" data-id="${docu.id}">Supprimer</button>
    `;

    vehicleList.appendChild(card);
  });

  document.querySelectorAll(".sortieBtn").forEach(btn =>
    btn.addEventListener("click", () => incrementSortie(btn.dataset.id))
  );

  document.querySelectorAll(".editBtn").forEach(btn =>
    btn.addEventListener("click", () => openEditModal(btn.dataset.id, btn.dataset.name))
  );

  document.querySelectorAll(".deleteBtn").forEach(btn =>
    btn.addEventListener("click", () => deleteVehicle(btn.dataset.id))
  );

  document.querySelectorAll(".vehicle-card img").forEach(img =>
    img.addEventListener("dblclick", () => incrementSortie(img.dataset.id))
  );
}


// ---------------------------------------------------------
// 🔥 AJOUT VÉHICULE
// ---------------------------------------------------------
addVehicleBtn.addEventListener("click", () => {
  addModal.style.display = "flex";
  capturedImage = null;
  imageFile.value = "";
});

closeAddModal.addEventListener("click", () => {
  addModal.style.display = "none";
  stopCamera();
});

openCameraBtn.addEventListener("click", async () => {
  cameraPreview.style.display = "block";

  cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
  cameraPreview.srcObject = cameraStream;

  cameraPreview.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = cameraPreview.videoWidth;
    canvas.height = cameraPreview.videoHeight;

    canvas.getContext("2d").drawImage(cameraPreview, 0, 0);
    capturedImage = canvas.toDataURL("image/jpeg");

    stopCamera();
    cameraPreview.style.display = "none";
  });
});

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

saveVehicleBtn.addEventListener("click", async () => {
  const name = document.getElementById("vehicleName").value.trim();

  if (!name) {
    alert("Merci d'indiquer un nom.");
    return;
  }

  if (!capturedImage) {
    alert("Merci de sélectionner une image ou de prendre une photo.");
    return;
  }

  await addDoc(collection(db, "users", userId, "vehicles"), {
    name,
    imageUrl: capturedImage,
    sorties: 0,
    createdAt: serverTimestamp()
  });

  addModal.style.display = "none";
  loadVehicles();
});


// ---------------------------------------------------------
// 🔥 MODIFIER VÉHICULE
// ---------------------------------------------------------
function openEditModal(id, name) {
  currentEditId = id;
  newEditedImage = null;
  editImageFile.value = "";
  document.getElementById("editName").value = name;
  editModal.style.display = "flex";
}

closeEditModal.addEventListener("click", () => {
  editModal.style.display = "none";
});

saveEditBtn.addEventListener("click", async () => {
  const newName = document.getElementById("editName").value.trim();

  if (!newName) return;

  const updateData = { name: newName };

  if (newEditedImage) {
    updateData.imageUrl = newEditedImage;
  }

  await updateDoc(doc(db, "users", userId, "vehicles", currentEditId), updateData);

  newEditedImage = null;
  editImageFile.value = "";

  editModal.style.display = "none";
  loadVehicles();
});


// ---------------------------------------------------------
// 🔥 SUPPRIMER VÉHICULE
// ---------------------------------------------------------
async function deleteVehicle(id) {
  if (!confirm("Supprimer ce véhicule ?")) return;

  await deleteDoc(doc(db, "users", userId, "vehicles", id));

  loadVehicles();
}


// ---------------------------------------------------------
// 🔥 INCRÉMENTER SORTIES
// ---------------------------------------------------------
async function incrementSortie(id) {
  const ref = doc(db, "users", userId, "vehicles", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const v = snap.data();
  const sorties = v.sorties || 0;

  // 🔥 1) On incrémente le compteur
  await updateDoc(ref, { sorties: sorties + 1 });

  // 🔥 2) On enregistre l'intervention dans l'historique
  const now = new Date();
  const date = now.toLocaleDateString("fr-FR");
  const heure = now.toLocaleTimeString("fr-FR");

  await addDoc(collection(db, "users", userId, "history"), {
    vehicleId: id,
    vehicleName: v.name,
    date: date,
    heure: heure,
    createdAt: serverTimestamp()
  });

  loadVehicles();
}



// ---------------------------------------------------------
// 🔥 BOUTON ADMIN
// ---------------------------------------------------------
const adminBtn = document.getElementById("admin-btn");

if (adminBtn) {
  adminBtn.addEventListener("click", () => {
    window.location.href = "./admin.html";
  });
}


// ---------------------------------------------------------
// 🔥 BOUTON HISTORIQUE
// ---------------------------------------------------------
const historyBtn = document.getElementById("history-btn");

if (historyBtn) {
  historyBtn.addEventListener("click", () => {
    window.location.href = "./historique.html";
  });
}
