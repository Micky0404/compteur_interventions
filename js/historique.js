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

  const total = values.reduce((a, b) => a + b, 0);

  const ctx = chartCanvas.getContext("2d");

  // 🔥 Charger ton logo
  const centerImage = new Image();
  centerImage.src = "./img/monimage.png";

  new Chart(chartCanvas, {
    type: "doughnut",
    plugins: [ChartDataLabels, {
      // 🔥 Plugin custom pour dessiner l’image au centre
      id: "centerImagePlugin",
      afterDraw(chart) {
        const { ctx, chartArea: { width, height } } = chart;

        const imgSize = Math.min(width, height) * 0.35; // taille du logo
        const x = chart.getDatasetMeta(0).data[0].x - imgSize / 2;
        const y = chart.getDatasetMeta(0).data[0].y - imgSize / 2;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(centerImage, x, y, imgSize, imgSize);
        ctx.restore();
      }
    }],
    data: {
      labels: labels,
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
      cutout: "65%", // 🔥 trou plus grand pour laisser place au logo
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
