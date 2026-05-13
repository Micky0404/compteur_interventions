import { auth, db, storage } from "./firebase-config.js";

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

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";


// ---------------------------------------------------------
// 🔥 CHARGEMENT UTILISATEUR
// ---------------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  try {
    const refUser = doc(db, "users", user.uid);
    const snap = await getDoc(refUser);

    if (!snap.exists()) {
      alert("Erreur : utilisateur introuvable.");
      await auth.signOut();
      return;
    }

    const data = snap.data();

    if (!data.validated) {
      alert("Votre compte n'est pas encore validé.");
      await auth.signOut();
      return;
    }

    if (data.role === "admin" || data.isAdmin === true) {
      const adminBtn = document.getElementById("admin-btn");
      if (adminBtn) adminBtn.style.display = "block";
    }

    const pseudoSpan = document.getElementById("pseudo");
    if (pseudoSpan) pseudoSpan.textContent = data.pseudo;

    loadVehicles();

  } catch (error) {
    console.error("Erreur chargement utilisateur :", error);
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
    const refVehicles = collection(db, "users", user.uid, "vehicles");
    const snap = await getDocs(refVehicles);

    list.innerHTML = "";

    snap.forEach(docu => {
      const v = docu.data();

      const card = document.createElement("div");
      card.className = "vehicle-card";

      card.innerHTML = `
        <h3>${v.name}</h3>
        <img src="${v.imageUrl || "./img/no-image.png"}" data-id="${docu.id}">
        <p>Sorties : <strong>${v.sorties}</strong></p>

        <button class="add-sortie-btn" data-id="${docu.id}">+1 sortie</button>
        <button class="edit-btn" data-id="${docu.id}">Modifier</button>
        <button class="delete-vehicle-btn" data-id="${docu.id}">Supprimer</button>
      `;

      list.appendChild(card);
    });

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
  }
}


// ---------------------------------------------------------
// 📸 GESTION PHOTO / UPLOAD
// ---------------------------------------------------------
let selectedImageFile = null;

// Ouvrir caméra
document.getElementById("takePhotoBtn").addEventListener("click", () => {
  document.getElementById("cameraInput").click();
});

// Photo via caméra
document.getElementById("cameraInput").addEventListener("change", (e) => {
  selectedImageFile = e.target.files[0];
  previewImage(selectedImageFile);
});

// Upload classique
document.getElementById("uploadImage").addEventListener("change", (e) => {
  selectedImageFile = e.target.files[0];
  previewImage(selectedImageFile);
});

// Preview
function previewImage(file) {
  const preview = document.getElementById("photoPreview");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
}


// ---------------------------------------------------------
// 🔥 AJOUTER UN VÉHICULE AVEC PHOTO
// ---------------------------------------------------------
document.getElementById("confirmAddVehicle").addEventListener("click", async () => {
  const name = document.getElementById("vehicleName").value.trim();

  if (name === "") {
    alert("Veuillez entrer un nom de véhicule.");
    return;
  }

  try {
    const user = auth.currentUser;
    const refVehicles = collection(db, "users", user.uid, "vehicles");

    let imageUrl = "";

    // 📸 Upload Storage si image sélectionnée
    if (selectedImageFile) {
      const storageRef = ref(storage, `vehicles/${user.uid}/${Date.now()}_${selectedImageFile.name}`);
      await uploadBytes(storageRef, selectedImageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    await addDoc(refVehicles, {
      name: name,
      sorties: 0,
      imageUrl: imageUrl,
      createdAt: serverTimestamp()
    });

    selectedImageFile = null;
    document.getElementById("vehicleName").value = "";
    document.getElementById("photoPreview").style.display = "none";

    addModal.style.display = "none";

    loadVehicles();

  } catch (error) {
    console.error("Erreur ajout véhicule :", error);
  }
});


// ---------------------------------------------------------
// 🔥 INCRÉMENTER SORTIES
// ---------------------------------------------------------
async function incrementVehicle(id) {
  try {
    const user = auth.currentUser;
    const refVehicle = doc(db, "users", user.uid, "vehicles", id);
    const snap = await getDoc(refVehicle);

    if (!snap.exists()) return;

    const current = snap.data().sorties || 0;

    await updateDoc(refVehicle, { sorties: current + 1 });

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
    const refVehicle = doc(db, "users", user.uid, "vehicles", id);

    await deleteDoc(refVehicle);

    loadVehicles();

  } catch (error) {
    console.error("Erreur suppression :", error);
  }
}


// ---------------------------------------------------------
// 🔥 MODIFIER NOM
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
    const refVehicle = doc(db, "users", user.uid, "vehicles", vehicleToEdit);

    await updateDoc(refVehicle, { name: newName });

    document.getElementById("editModal").style.display = "none";
    document.getElementById("editVehicleName").value = "";

    loadVehicles();

  } catch (error) {
    console.error("Erreur modification :", error);
  }
});
