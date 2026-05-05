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

  // 🔥 Structure pour le graphique
  const vehicleCounts = {};   // { "VSAV 1": 4, "FPT": 2 }
  const labels = [];          // Dates
  const values = [];          // Nombre total par date

  snapshot.forEach((docu) => {
    const data = docu.data();
    const date = data.timestamp.toDate();
    const dateStr = date.toLocaleDateString();

    // 🔥 Tableau
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${dateStr}</td>
      <td>${date.toLocaleTimeString()}</td>
      <td>${data.vehicleName} — +1 sortie</td>
    `;
    table.appendChild(row);

    // 🔥 Compter par véhicule
    if (!vehicleCounts[data.vehicleName]) {
      vehicleCounts[data.vehicleName] = 0;
    }
    vehicleCounts[data.vehicleName] += 1;
  });

  drawChart(vehicleCounts);
}

// ---------------------------------------------------------
// 🔥 Nouveau graphique premium
// ---------------------------------------------------------
function drawChart(vehicleCounts) {
  const labels = Object.keys(vehicleCounts);
  const values = Object.values(vehicleCounts);

  // Dégradé rouge neon
  const ctx = chartCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(255, 50, 50, 0.9)");
  gradient.addColorStop(1, "rgba(255, 0, 0, 0.3)");

  new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Sorties par véhicule",
        data: values,
        backgroundColor: gradient,
        borderColor: "#ff1a1a",
        borderWidth: 2,
        borderRadius: 10,
        hoverBackgroundColor: "rgba(255, 80, 80, 1)"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "white" }
        }
      },
      scales: {
        x: {
          ticks: { color: "white" },
          grid: { color: "rgba(255,255,255,0.1)" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "white" },
          grid: { color: "rgba(255,255,255,0.1)" }
        }
      }
    }
  });
}
