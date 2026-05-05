import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let table;
let chartCanvas;
let currentChart = null;
let userId = null;

// ---------------------------------------------------------
// 🔥 Attendre que le DOM soit prêt
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  table = document.getElementById("history-table");
  chartCanvas = document.getElementById("chart");
});

// ---------------------------------------------------------
// 🔥 Vérification utilisateur
// ---------------------------------------------------------
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
  if (!table) return;

  const q = query(
    collection(db, "users", userId, "history"),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);

  table.innerHTML = "";

  const vehicleCounts = {};

  snapshot.forEach((docu) => {
    const data = docu.data();

    if (!data.timestamp) return; // sécurité
    const date = data.timestamp.toDate();

    // 🔥 Ligne du tableau : on affiche seulement le nom du véhicule
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${date.toLocaleDateString()}</td>
      <td>${date.toLocaleTimeString()}</td>
      <td>${data.vehicleName}</td>
    `;
    table.appendChild(row);

    // 🔥 Comptage pour le graphique
    if (!vehicleCounts[data.vehicleName]) {
      vehicleCounts[data.vehicleName] = 0;
    }
    vehicleCounts[data.vehicleName]++;
  });

  drawChart(vehicleCounts);
}

// ---------------------------------------------------------
// 🔥 Graphique DONUT premium
// ---------------------------------------------------------
function drawChart(vehicleCounts) {
  if (!chartCanvas) return;

  const labels = Object.keys(vehicleCounts);
  const values = Object.values(vehicleCounts);

  if (labels.length === 0) {
    chartCanvas.style.display = "none";
    return;
  }

  chartCanvas.style.display = "block";

  const total = values.reduce((a, b) => a + b, 0);

  const ctx = chartCanvas.getContext("2d");

  // 🔥 Détruire l’ancien graphique si présent
  if (currentChart) {
    currentChart.destroy();
  }

  // 🔥 Charger le logo une seule fois
  const centerImage = new Image();
  centerImage.src = "./monimage.png";

  currentChart = new Chart(chartCanvas, {
    type: "doughnut",
    plugins: [
      ChartDataLabels,
      {
        id: "centerImagePlugin",
        afterDraw(chart) {
          const { ctx, chartArea: { width, height } } = chart;

          const imgSize = Math.min(width, height) * 0.35;
          const x = chart.getDatasetMeta(0).data[0].x - imgSize / 2;
          const y = chart.getDatasetMeta(0).data[0].y - imgSize / 2;

          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.drawImage(centerImage, x, y, imgSize, imgSize);
          ctx.restore();
        }
      }
    ],
    data: {
      labels,
      datasets: [{
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
      cutout: "65%",
      plugins: {
        legend: {
          labels: { color: "white", font: { size: 14 } }
        },
        datalabels: {
          color: "white",
          font: { weight: "bold", size: 14 },
          align: "end",
          anchor: "end",
          offset: 8,
          formatter: (value, ctx) => {
            const percent = (value / total) * 100;
            const vehicleName = ctx.chart.data.labels[ctx.dataIndex];
            return percent.toFixed(1) + "%\n" + vehicleName;
          }
        }
      }
    }
  });
}
