import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let tableBody;
let chartCanvas;
let currentChart = null;
let userId = null;

// ---------------------------------------------------------
// 🔥 DOM READY
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  tableBody = document.getElementById("history-table-body");
  chartCanvas = document.getElementById("chart");
});

// ---------------------------------------------------------
// 🔥 Vérification utilisateur
// ---------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Erreur : utilisateur introuvable.");
      await signOut(auth);
      return;
    }

    const data = snap.data();

    if (!data.validated) {
      alert("Votre compte n'est pas encore validé.");
      await signOut(auth);
      return;
    }

    if (data.role === "admin" || data.isAdmin === true) {
      const adminBtn = document.getElementById("admin-btn");
      if (adminBtn) adminBtn.style.display = "block";
    }

    userId = user.uid;
    await loadHistory(); // 🔥 Attente explicite pour éviter les courses de données

  } catch (error) {
    console.error("Erreur auth :", error);
    alert("Erreur interne.");
  }
});

// ---------------------------------------------------------
// 🔥 Charger l’historique
// ---------------------------------------------------------
async function loadHistory() {
  if (!tableBody || !userId) return;

  try {
    const q = query(
      collection(db, "users", userId, "history"),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);
    tableBody.innerHTML = "";

    if (snapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; opacity:0.7;">
            Aucun historique pour le moment
          </td>
        </tr>`;
      chartCanvas.style.display = "none";
      return;
    }

    const vehicleCounts = {};

    snapshot.forEach((docu) => {
      const data = docu.data();
      if (!data.createdAt) return;

      const date = data.createdAt.toDate();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${date.toLocaleDateString("fr-FR")}</td>
        <td>${date.toLocaleTimeString("fr-FR")}</td>
        <td>${data.vehicleName}</td>
      `;
      tableBody.appendChild(row);

      vehicleCounts[data.vehicleName] = (vehicleCounts[data.vehicleName] || 0) + 1;
    });

    drawChart(vehicleCounts);

  } catch (error) {
    console.error("Erreur chargement historique :", error);
    tableBody.innerHTML = "<tr><td colspan='3'>Erreur lors du chargement.</td></tr>";
  }
}

// ---------------------------------------------------------
// 🔥 Graphique DONUT
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

  if (currentChart) currentChart.destroy();

  currentChart = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#ff6384",
          "#36a2eb",
          "#ffcd56",
          "#4bc0c0",
          "#9966ff",
          "#ff9f40"
        ],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      plugins: {
        datalabels: {
          color: "#fff",
          font: { weight: "bold", size: 14 },
          formatter: (value) => value
        }
      }
    }
  });
}
