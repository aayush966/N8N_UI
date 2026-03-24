let isRunning = false;
let controller = null;
let currentExecutionId = null; // ✅ Store execution ID

document.getElementById("runBtn").addEventListener("click", runWorkflow);
document.getElementById("stopBtn").addEventListener("click", stopWorkflow);

async function runWorkflow() {

    const runBtn = document.getElementById("runBtn");
    const stopBtn = document.getElementById("stopBtn");

    // 🚫 Prevent multiple runs
    if (isRunning) {
        alert("⚠️ Workflow is Processing. Please try after some time.");
        return;
    }

    isRunning = true;

    const statusDiv = document.getElementById("status");
    const table = document.getElementById("resultTable");
    const tbody = table.querySelector("tbody");

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!startDate || !endDate) {
        statusDiv.innerHTML = "❗ Please select both dates";
        statusDiv.className = "error";
        isRunning = false;
        return;
    }

    // 🔒 UI Lock
    runBtn.classList.add("disabled");
    runBtn.innerText = "Running...";
    stopBtn.style.display = "inline-block";

    statusDiv.innerHTML = "⏳ Processing...";
    statusDiv.className = "loading";

    table.style.display = "none";
    tbody.innerHTML = "";

    controller = new AbortController();
    currentExecutionId = null; // ✅ Reset before every new run

    try {

        const response = await fetch("https://teamaii.app.n8n.cloud/webhook/uniuni", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "shipcube": "ship@3*#cube@2*#1$$"
            },
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();

        // ✅ Save execution ID immediately after response
        if (data.executionId) {
            currentExecutionId = data.executionId;
            console.log("Execution ID saved:", currentExecutionId);
        }

        let records = data;

        if (!Array.isArray(records)) {
            records = data.data || data.body || [];
        }

        if (!Array.isArray(records)) {
            throw new Error("Invalid response format");
        }

        let rowsHTML = "";

        records.forEach(item => {
            let statusClass = "";

            if (item.status?.toLowerCase().includes("delivered")) {
                statusClass = "delivered";
            }

            rowsHTML += `
                <tr>
                    <td>${item.order_id ?? ""}</td>
                    <td>${item.shipping_carrier ?? ""}</td>
                    <td>${item.tracking_number ?? ""}</td>
                    <td class="${statusClass}">${item.status ?? ""}</td>
                </tr>
            `;
        });

        tbody.innerHTML = rowsHTML;

        table.style.display = "table";
        statusDiv.innerHTML = `✅ Loaded ${records.length} records successfully`;
        statusDiv.className = "";

    } catch (error) {

        if (error.name === "AbortError") {
            statusDiv.innerHTML = "⛔ Workflow stopped by user";
        } else {
            statusDiv.innerHTML = `❌ ${error.message}`;
            statusDiv.className = "error";
        }

    } finally {
        resetUI();
    }
}


// 🛑 STOP WORKFLOW FUNCTION
async function stopWorkflow() {

    const statusDiv = document.getElementById("status");

    try {
        // ✅ Step 1 - Abort frontend fetch request
        if (controller) {
            controller.abort();
        }

        // ✅ Step 2 - Stop n8n execution via REST API
        if (currentExecutionId) {
            const stopRes = await fetch(
                `https://teamaii.app.n8n.cloud/api/v1/executions/${currentExecutionId}/stop`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-N8N-API-KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NTc5YjlhNS04NDI5LTQ1NGYtYmU3Yy1iMWRhZDNhZjJjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWVhYjY3ZmUtYjUxOS00MDE4LTliZjAtYThlNzc5ODllNzU1IiwiaWF0IjoxNzc0MzQyMTQwLCJleHAiOjE3ODIwNjY2MDB9.pnzMN1oBlwmDoOe6wy2xYcRYSTIIFRrcnqrGMi2eIw8"  
                    }
                }
            );

            if (stopRes.ok) {
                statusDiv.innerHTML = "⛔ Workflow stopped successfully";
            } else {
                statusDiv.innerHTML = `⚠️ Could not stop n8n execution (Status: ${stopRes.status})`;
            }

        } else {
            // No execution ID means workflow hasn't responded yet
            statusDiv.innerHTML = "⛔ Request cancelled before workflow started";
        }

    } catch (error) {
        if (error.name === "AbortError") {
            statusDiv.innerHTML = "⛔ Request cancelled";
        } else {
            statusDiv.innerHTML = `❌ Failed to stop workflow: ${error.message}`;
        }
    } finally {
        resetUI(); // ✅ Always reset UI after stop
    }
}


// 🔄 RESET UI
function resetUI() {

    isRunning = false;
    currentExecutionId = null; // ✅ Clear execution ID after reset

    const runBtn = document.getElementById("runBtn");
    const stopBtn = document.getElementById("stopBtn");

    runBtn.classList.remove("disabled");
    runBtn.innerText = "Run Tracking";

    // ✅ Hide stop button after reset
}