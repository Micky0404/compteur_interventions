import { auth, db } from "./firebase-config.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp
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
      </div>
    `;
  });

  // Double clic sur image → sorties++
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

  // Convertir image en base64 (GitHub Pages friendly)
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
