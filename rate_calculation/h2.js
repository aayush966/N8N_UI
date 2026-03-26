/// ================================
// CONFIG
// ================================
const INPUT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1jR-tnyw1DtD3JxqMURwtGevnpoH25-LVD611yv6MG0s/edit?gid=0#gid=0";

const WEBHOOK_URL = "https://teamaii.app.n8n.cloud/webhook-test/rate_calculation";

const API_BASE = "https://teamaii.app.n8n.cloud/rest";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NTc5YjlhNS04NDI5LTQ1NGYtYmU3Yy1iMWRhZDNhZjJjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTQ0MWI1ZjYtMGE3OC00YjM2LWI5Y2MtZjFlN2YzYzI4OTVhIiwiaWF0IjoxNzc0NTE1NDAwLCJleHAiOjE3ODIyMzk0MDB9.eOy0b3mBESWno_k4MXAEeVmTvupJ4ufXxoVDiLSIJWc"; // ⚠️ regenerate

let executionId = null;
let rows = [];

// ================================
// DOM
// ================================
const openSheetBtn = document.getElementById("openSheet");
const runBtn = document.getElementById("run");
const stopBtn = document.getElementById("stop");
const downloadBtn = document.getElementById("download");
const statusText = document.getElementById("status");
const tableBody = document.querySelector("#resultTable tbody");

// ================================
// OPEN SHEET
// ================================
openSheetBtn.addEventListener("click", () => {
  window.open(INPUT_SHEET_URL, "_blank");
});

// ================================
// RUN WORKFLOW
// ================================
runBtn.addEventListener("click", async () => {
  statusText.textContent = "🚀 Starting workflow...";
  runBtn.disabled = true;
  stopBtn.disabled = false;
  tableBody.innerHTML = "";
  rows = [];
  executionId = null;

  try {
    // STEP 1: Start workflow (instant response)
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ trigger: "run" })
    });

    const data = await response.json();

    // ✅ Get executionId immediately
    executionId = data.executionId;

    if (!executionId) {
      throw new Error("No executionId received");
    }

    console.log("Execution ID:", executionId);
    statusText.textContent = "⏳ Workflow running...";

    // STEP 2: OPTIONAL - Poll for results (if you store somewhere)
    // (skip if not implemented)

  } catch (error) {
    console.error(error);
    statusText.textContent = "❌ Error starting workflow";
    runBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

// ================================
// STOP WORKFLOW
// ================================
stopBtn.addEventListener("click", async () => {
  if (!executionId) {
    statusText.textContent = "⚠️ No running workflow";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/executions/${executionId}`, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": API_KEY
      }
    });

    if (!res.ok) {
      throw new Error("Stop API failed");
    }

    statusText.textContent = "⛔ Workflow stopped";
    runBtn.disabled = false;
    stopBtn.disabled = true;

  } catch (error) {
    console.error(error);
    statusText.textContent = "❌ Error stopping workflow";
  }
});

// ================================
// RENDER TABLE (if you later fetch results)
// ================================
function renderTable(data) {
  tableBody.innerHTML = "";

  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.Zipcode ?? ""}</td>
      <td>${r.Weight ?? ""}</td>
      <td>${r.Nearest_Hub ?? ""}</td>
      <td>${r.Rate_Zone ?? ""}</td>
      <td>${r.Effective_Weight ?? ""}</td>
      <td>${r.Best_Company ?? ""}</td>
      <td>${r.Cheapest_Price ?? ""}</td>
      <td>${r.PA_zone ?? ""}</td>
      <td>${r.Cheapest_PA ?? ""}</td>
      <td>${r.TX_zone ?? ""}</td>
      <td>${r.Cheapest_TX ?? ""}</td>
      <td>${r.CA_zone ?? ""}</td>
      <td>${r.Cheapest_CA ?? ""}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// ================================
// DOWNLOAD CSV
// ================================
downloadBtn.addEventListener("click", () => {
  let csv =
    "Zipcode,Weight,Nearest_Hub,Rate_Zone,Effective_Weight,Best_Company,Cheapest_Price,PA_zone,Cheapest_PA,TX_zone,Cheapest_TX,CA_zone,Cheapest_CA\n";

  rows.forEach(r => {
    csv += [
      r.Zipcode,
      r.Weight,
      r.Nearest_Hub,
      r.Rate_Zone,
      r.Effective_Weight,
      r.Best_Company,
      r.Cheapest_Price,
      r.PA_zone,
      r.Cheapest_PA,
      r.TX_zone,
      r.Cheapest_TX,
      r.CA_zone,
      r.Cheapest_CA
    ].map(v => `"${v ?? ""}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "shipping_output.csv";
  a.click();

  URL.revokeObjectURL(url);
});
