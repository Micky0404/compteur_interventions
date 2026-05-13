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

let currentEditId = null;
let currentOwnerId = null;
let cameraStream = null;
let capturedImage = null;
let userId = null;
let isAdmin = false;


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

