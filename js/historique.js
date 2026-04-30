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

  const labels = [];
  const values = [];

  table.innerHTML = "";

  snapshot.forEach((docu) => {
    const data = docu.data();
    const date = data.timestamp.toDate();

    // Tableau
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${date.toLocaleDateString()}</td>
      <td>${date.toLocaleTimeString()}</td>
      <td>+1 intervention</td>
    `;
    table.appendChild(row);

    // Graphique
    labels.push(date.toLocaleDateString());
    values.push(1);
  });

  drawChart(labels, values);
}

// ---------------------------------------------------------
// 🔥 Graphique Chart.js
// ---------------------------------------------------------
function drawChart(labels, values) {
  new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Interventions",
        data: values,
        borderColor: "#ff2a2a",
        backgroundColor: "rgba(255,42,42,0.3)",
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
