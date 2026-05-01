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

  document.getElementById("pseudo").textContent = snap.data().pseudo;

  // Afficher bouton admin
  if (snap.data().role === "admin") {
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
  list.innerHTML = "";

  const ref = collection(db, "users", user.uid, "vehicles");
  const snap = await getDocs(ref);

  snap.forEach(docu => {
    const v = docu.data();

    list.innerHTML += `
      <div class="vehicle-card">
        <h3>${v.name}</h3>
        <img src="${v.imageUrl}" data-id="${docu.id}">
        <p>Sorties : <strong>${v.sorties}</strong></p>

        <!-- 🔥 Bouton +1 sortie -->
        <button class="add-sortie-btn" data-id="${docu.id}">
          +1 sortie
        </button>

        <!-- ❌ Bouton suppression -->
        <button class="delete-vehicle-btn" data-id="${docu.id}">
          Supprimer
        </button>
      </div>
    `;
  });

  // Listener +1 sortie
  document.querySelectorAll(".add-sortie-btn").forEach(btn => {
    btn.addEventListener("click", () => incrementVehicle(btn.dataset.id));
  });

  // Listener suppression
  document.querySelectorAll(".delete-vehicle-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteVehicle(btn.dataset.id));
  });

  // Listener double-clic sur image
  document.querySelectorAll(".vehicle-card img").forEach(img => {
    img.addEventListener("dblclick", () => incrementVehicle(img.dataset.id));
  });
}


// ---------------------------------------------------------
// 🔥 AJOUT VEHICULE
// ---------------------------------------------------------
document.getElementById("addVehicleBtn").addEventListener("click", () => {
  document.getElementById("vehicleModal").style.display = "flex";
});

document.getElementById("saveVehicleBtn").addEventListener("click", saveVehicle);

async function saveVehicle() {
  const name = document.getElementById("vehicleName").value.trim();
  const file = document.getElementById("uploadImage").files[0];

  if (!name || !file) {
    alert("Nom + image obligatoires");
    return;
  }

  const base64 = await toBase64(file);
  const user = auth.currentUser;

  await addDoc(collection(db, "users", user.uid, "vehicles"), {
    name: name,
    imageUrl: base64,
    sorties: 0,
    createdAt: serverTimestamp()
  });

  document.getElementById("vehicleModal").style.display = "none";
  loadVehicles();
}


// ---------------------------------------------------------
// 🔥 INCRÉMENTER SORTIES
// ---------------------------------------------------------
async function incrementVehicle(id) {
  const user = auth.currentUser;
  const ref = doc(db, "users", user.uid, "vehicles", id);
  const snap = await getDoc(ref);

  const newValue = snap.data().sorties + 1;

  await updateDoc(ref, { sorties: newValue });

  loadVehicles();
}


// ---------------------------------------------------------
// ❌ SUPPRIMER UN VÉHICULE
// ---------------------------------------------------------
async function deleteVehicle(id) {
  const user = auth.currentUser;
  const ref = doc(db, "users", user.uid, "vehicles", id);

  if (!confirm("Supprimer ce véhicule ?")) return;

  await deleteDoc(ref);

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
document.getElementById("logout-btn").addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "./login.html";
});
