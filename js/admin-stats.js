import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---------------------------------------------------------
// 🔥 CHARGER LES STATS GLOBALES
// ---------------------------------------------------------
async function loadStats() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));

    let totalUsers = 0;
    let validatedUsers = 0;
    let totalVehicles = 0;
    let totalSorties = 0;

    const vehicleCountMap = {}; // Pour le graphique top véhicules

    usersSnap.forEach(async (userDoc) => {
      totalUsers++;

      const user = userDoc.data();
      if (user.validated) validatedUsers++;

      // Charger les véhicules de l'utilisateur
      const vehiclesSnap = await getDocs(
        collection(db, "users", userDoc.id, "vehicles")
      );

      vehiclesSnap.forEach((vDoc) => {
        const v = vDoc.data();

        totalVehicles++;
        totalSorties += v.sorties;

        // Compter les sorties par véhicule (pour le top chart)
        if (!vehicleCountMap[v.name]) vehicleCountMap[v.name] = 0;
        vehicleCountMap[v.name] += v.sorties;
      });

      // Mise à jour DOM après chaque utilisateur
      updateStatsDOM(totalUsers, validatedUsers, totalVehicles, totalSorties);

      // Mise à jour du graphique
      updateChart(vehicleCountMap);
    });

  } catch (error) {
    console.error("Erreur chargement stats :", error);
  }
}


// ---------------------------------------------------------
// 🔥 METTRE À JOUR LE DOM
// ---------------------------------------------------------
function updateStatsDOM(totalUsers, validatedUsers, totalVehicles, totalSorties) {
  document.getElementById("totalUsers").textContent = totalUsers;
  document.getElementById("validatedUsers").textContent = validatedUsers;
  document.getElementById("totalVehicles").textContent = totalVehicles;
  document
