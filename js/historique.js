import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, orderBy, query, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Erreur : utilisateur introuvable.");
      await auth.signOut();
      return;
    }

    const data = snap.data();

    // 🔥 Bloquer si non validé
    if (!data.validated) {
      alert("Votre compte n'est pas encore validé.");
      await auth.signOut();
      return;
    }

    userId = user.uid;
    loadHistory();

  } catch (error) {
    console.error("Erreur auth :", error);
    alert("Erreur interne.");
  }
});

// ---------------------------------------------------------
// 🔥 Charger l’historique
// ---------------------------------------------------------
async function loadHistory() {
  if (!table) return;

  try {
    const q = query(
      collection(db, "users", userId, "history"),
      orderBy("timestamp", "asc")
    );

    const snapshot = await getDocs(q);

    table.innerHTML = "";

    const vehicleCounts = {};

    snapshot.forEach((docu) => {
      const data = docu.data();

      if (!data.timestamp) return;
      const date = data.timestamp.toDate();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${date.toLocaleDateString()}</td>
        <td>${date.toLocaleTimeString()}</td>
        <td>${data.vehicleName}</td>
      `;
      table.appendChild(row);

      if (!vehicleCounts[data.vehicleName]) {
        vehicleCounts[data.vehicleName] = 0;
      }
      vehicleCounts[data.vehicleName]++;
    });

    drawChart(vehicleCounts);

  } catch (error) {
    console.error("Erreur chargement historique :", error);
    table.innerHTML = "<tr><td colspan='3'>Erreur lors du chargement.</td></tr>";
  }
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

  if (currentChart) {
    currentChart.destroy();
  }

  const centerImage = new Image();
  centerImage.src = "./monimage.png";

  currentChart = new Chart(chartCanvas, {
    type: "doughnut",
    plugins: [
      ChartDataLabels,
      {
        id: "centerImagePlugin",
        afterDraw(chart) {
          if (!centerImage.complete) return;

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
