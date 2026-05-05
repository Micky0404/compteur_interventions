import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const table = document.getElementById("history-table");
const chartCanvas = document.getElementById("chart");

let userId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  userId = user.uid;
  loadHistory();
});

// ---------------------------------------------------------
// 🔥 Charger l’historique
// ---------------------------------------------------------
async function loadHistory() {
  const q = query(
    collection(db, "users", userId, "history"),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);

  table.innerHTML = "";

  // 🔥 Compteur par véhicule
  const vehicleCounts = {}; // { "VSAV 1": 4, "FPT": 2 }

  snapshot.forEach((docu) => {
    const data = docu.data();
    const date = data.timestamp.toDate();

    // Tableau
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${date.toLocaleDateString()}</td>
      <td>${date.toLocaleTimeString()}</td>
      <td>${data.vehicleName} — +1 sortie</td>
    `;
    table.appendChild(row);

    // Compter par véhicule
    if (!vehicleCounts[data.vehicleName]) {
      vehicleCounts[data.vehicleName] = 0;
    }
    vehicleCounts[data.vehicleName] += 1;
  });

  drawChart(vehicleCounts);
}

// ---------------------------------------------------------
// 🔥 Nouveau graphique DONUT premium
// ---------------------------------------------------------
function drawChart(vehicleCounts) {
  const labels = Object.keys(vehicleCounts);
  const values = Object.values(vehicleCounts);

  const ctx = chartCanvas.getContext("2d");

  // Dégradé neon rouge
  const gradient = ctx.createLinearGradient(0, 0, 300, 300);
  gradient.addColorStop(0, "rgba(255, 50, 50, 1)");
  gradient.addColorStop(1, "rgba(255, 0, 0, 0.4)");

  new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        label: "Sorties par véhicule",
        data: values,
        backgroundColor: [
          "rgba(255, 50, 50, 0.9)",
          "rgba(255, 80, 80, 0.9)",
          "rgba(255, 0, 0, 0.9)",
          "rgba(255, 120, 120, 0.9)"
        ],
        borderColor: "#ff1a1a",
        borderWidth: 2,
        hoverOffset: 15
      }]
    },
    options: {
      cutout: "60%", // Taille du trou central
      plugins: {
        legend: {
          labels: { color: "white", font: { size: 14 } }
        }
      }
    }
  });
}
