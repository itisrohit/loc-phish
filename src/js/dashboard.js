import { auth, db } from "../firebase-config.js";

// UI elements
const appLoading = document.getElementById("appLoading");
const dashboardScreen = document.getElementById("dashboardScreen");
const onboardingState = document.getElementById("onboardingState");
const headerActions = document.getElementById("headerActions");
const dbModeBadge = document.getElementById("dbModeBadge");
const userEmailDisplay = document.getElementById("userEmailDisplay");
const logoutBtn = document.getElementById("logoutBtn");

// Modal elements
const createSessionModal = document.getElementById("createSessionModal");
const openCreateModalBtn = document.getElementById("openCreateModalBtn");
const onboardingCreateBtn = document.getElementById("onboardingCreateBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");

// Session form elements
const createSessionForm = document.getElementById("createSessionForm");
const sessionName = document.getElementById("sessionName");
const sessionHostname = document.getElementById("sessionHostname");
const sessionRedirect = document.getElementById("sessionRedirect");
const sessionsListContainer = document.getElementById("sessionsListContainer");

// Detail view elements
const activeDetailState = document.getElementById("activeDetailState");
const activeSessionName = document.getElementById("activeSessionName");
const activeSessionHost = document.getElementById("activeSessionHost");
const activeSessionRedirect = document.getElementById("activeSessionRedirect");
const activeLinkUrl = document.getElementById("activeLinkUrl");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const refreshLogsBtn = document.getElementById("refreshLogsBtn");
const logsTableBody = document.getElementById("logsTableBody");
const noLogsState = document.getElementById("noLogsState");
const copyToast = document.getElementById("copyToast");

// Visitor Details Modal elements
const logDetailModal = document.getElementById("logDetailModal");
const detailTimestamp = document.getElementById("detailTimestamp");
const detailIp = document.getElementById("detailIp");
const detailRay = document.getElementById("detailRay");
const detailReferrer = document.getElementById("detailReferrer");
const detailUa = document.getElementById("detailUa");
const detailLabelInput = document.getElementById("detailLabelInput");
const saveLogLabelBtn = document.getElementById("saveLogLabelBtn");
const deleteLogBtn = document.getElementById("deleteLogBtn");
const closeLogModalBtn = document.getElementById("closeLogModalBtn");
const closeLogModalBtn2 = document.getElementById("closeLogModalBtn2");

// Edit Session Modal & Header Trigger
const editSessionModal = document.getElementById("editSessionModal");
const editSessionBtn = document.getElementById("editSessionBtn");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");
const cancelEditModalBtn = document.getElementById("cancelEditModalBtn");
const editSessionForm = document.getElementById("editSessionForm");
const editSessionName = document.getElementById("editSessionName");
const editSessionHostname = document.getElementById("editSessionHostname");
const editSessionRedirect = document.getElementById("editSessionRedirect");

// State Variables
let currentUser = null;
let selectedSession = null;
let selectedLog = null;
let sessions = [];
let logPollingInterval = null;

// Display mode info
dbModeBadge.textContent = auth.isMock ? "Mock Local DB" : "Cloud Firebase";
if (!auth.isMock) {
  dbModeBadge.classList.add("real");
}

// Monitor Auth State
auth.onAuthStateChanged((user) => {
  currentUser = user;
  
  if (user) {
    // Logged in
    appLoading.style.display = "none";
    document.body.classList.add("dashboard-active");
    headerActions.style.display = "flex";
    userEmailDisplay.textContent = user.email;
    loadSessions();
  } else {
    // Logged out - Redirect to login page immediately
    document.body.classList.remove("dashboard-active");
    window.location.replace("/pages/login.html");
  }
});


// Logout Action
logoutBtn.addEventListener("click", async () => {
  await auth.logout();
});

// Modal Action Listeners (Create Session)
function openModal() {
  createSessionModal.style.display = "flex";
  sessionName.focus();
}

function closeModal() {
  createSessionModal.style.display = "none";
  createSessionForm.reset();
}

if (openCreateModalBtn) openCreateModalBtn.addEventListener("click", openModal);
if (onboardingCreateBtn) onboardingCreateBtn.addEventListener("click", openModal);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

// Close modal on click outside modal card
createSessionModal.addEventListener("click", (e) => {
  if (e.target === createSessionModal) {
    closeModal();
  }
});

// Modal Action Listeners (Edit Session)
function openEditModal() {
  if (!selectedSession) return;
  editSessionName.value = selectedSession.name;
  editSessionHostname.value = selectedSession.hostname;
  editSessionRedirect.value = selectedSession.redirect;
  editSessionModal.style.display = "flex";
  editSessionName.focus();
}

function closeEditModal() {
  editSessionModal.style.display = "none";
  editSessionForm.reset();
}

if (editSessionBtn) editSessionBtn.addEventListener("click", openEditModal);
if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", closeEditModal);
if (cancelEditModalBtn) cancelEditModalBtn.addEventListener("click", closeEditModal);

editSessionModal.addEventListener("click", (e) => {
  if (e.target === editSessionModal) {
    closeEditModal();
  }
});

// Edit Campaign Submit Action
editSessionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser || !selectedSession) return;

  const name = editSessionName.value.trim();
  const hostname = editSessionHostname.value.trim();
  const redirect = editSessionRedirect.value.trim();

  try {
    await db.updateSession(selectedSession.id, {
      name,
      hostname,
      redirect
    });
    closeEditModal();
    // Update local selectedSession reference
    selectedSession.name = name;
    selectedSession.hostname = hostname;
    selectedSession.redirect = redirect;
    // Reload UI
    await loadSessions();
  } catch (err) {
    alert("Error updating campaign: " + err.message);
  }
});

// Visitor Details Modal Actions
function openLogModal(log) {
  selectedLog = log;
  detailTimestamp.textContent = new Date(log.timestamp).toLocaleString();
  detailIp.textContent = log.ip || "Unknown";
  detailRay.textContent = log.rayId || "N/A";
  detailReferrer.textContent = log.referrer || "Direct";
  detailUa.textContent = log.userAgent || "Unknown";
  detailLabelInput.value = log.label || "";
  logDetailModal.style.display = "flex";
}

function closeLogModal() {
  logDetailModal.style.display = "none";
  selectedLog = null;
}

if (closeLogModalBtn) closeLogModalBtn.addEventListener("click", closeLogModal);
if (closeLogModalBtn2) closeLogModalBtn2.addEventListener("click", closeLogModal);

// Close details modal on click outside modal card
logDetailModal.addEventListener("click", (e) => {
  if (e.target === logDetailModal) {
    closeLogModal();
  }
});

// Save Visitor label
saveLogLabelBtn.addEventListener("click", async () => {
  if (!selectedSession || !selectedLog) return;
  const newLabel = detailLabelInput.value.trim();
  try {
    await db.updateLog(selectedSession.id, selectedLog.id, { label: newLabel });
    selectedLog.label = newLabel;
    await loadLogs(selectedSession.id);
    const origText = saveLogLabelBtn.textContent;
    saveLogLabelBtn.textContent = "Saved ✔️";
    setTimeout(() => {
      saveLogLabelBtn.textContent = origText;
    }, 1500);
  } catch (err) {
    console.error("Error saving visitor label:", err);
    alert("Failed to save label: " + err.message);
  }
});

// Delete individual visitor log
deleteLogBtn.addEventListener("click", async () => {
  if (!selectedSession || !selectedLog) return;
  if (confirm("Are you sure you want to delete this visitor record?")) {
    try {
      await db.deleteLog(selectedSession.id, selectedLog.id);
      closeLogModal();
      await loadLogs(selectedSession.id);
    } catch (err) {
      console.error("Error deleting log record:", err);
      alert("Failed to delete record: " + err.message);
    }
  }
});

// Create New Session
createSessionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const name = sessionName.value.trim();
  const hostname = sessionHostname.value.trim();
  const redirect = sessionRedirect.value.trim();

  try {
    const newSession = await db.createSession(currentUser.uid, {
      name,
      hostname,
      redirect
    });
    
    closeModal();
    await loadSessions();
    selectSession(newSession);
  } catch (err) {
    alert("Error creating session: " + err.message);
  }
});

// Copy Link Action
copyLinkBtn.addEventListener("click", () => {
  const urlText = activeLinkUrl.textContent;
  navigator.clipboard.writeText(urlText).then(() => {
    // Show copy toast
    copyToast.classList.add("show");
    setTimeout(() => {
      copyToast.classList.remove("show");
    }, 2000);
  });
});

// Refresh Logs
refreshLogsBtn.addEventListener("click", () => {
  if (selectedSession) {
    loadLogs(selectedSession.id);
  }
});

// Fetch and display user sessions
async function loadSessions() {
  if (!currentUser) return;
  
  try {
    sessions = await db.getSessions(currentUser.uid);
    
    if (sessions.length === 0) {
      // Show onboarding screen, hide dashboard list workspace
      dashboardScreen.style.display = "none";
      onboardingState.style.display = "block";
      selectedSession = null;
      if (logPollingInterval) {
        clearInterval(logPollingInterval);
      }
    } else {
      // Show dashboard list workspace, hide onboarding screen
      onboardingState.style.display = "none";
      dashboardScreen.style.display = "grid";
      renderSessions();
      
      // Auto-select first session if nothing is active or selected
      if (!selectedSession || !sessions.find(s => s.id === selectedSession.id)) {
        selectSession(sessions[0]);
      } else {
        // Keep active session selected but reload details/logs
        const updatedSession = sessions.find(s => s.id === selectedSession.id);
        selectSession(updatedSession);
      }
    }
  } catch (err) {
    console.error("Error loading sessions:", err);
  }
}

// Render sessions to sidebar
function renderSessions() {
  sessionsListContainer.innerHTML = "";
  
  if (sessions.length === 0) {
    sessionsListContainer.innerHTML = `
      <div class="no-sessions-sidebar">
        <svg viewBox="0 0 24 24" class="sidebar-empty-icon" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="1.5" stroke-dasharray="3 3"/>
          <path d="M12 8v8M8 12h8" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>No active campaigns</span>
      </div>
    `;
    return;
  }

  sessions.forEach(session => {
    const item = document.createElement("div");
    item.className = `session-item ${selectedSession && selectedSession.id === session.id ? "active" : ""}`;
    
    const dateFormatted = new Date(session.createdAt).toLocaleDateString();
    
    item.innerHTML = `
      <div class="session-header">
        <span class="session-name">${escapeHtml(session.name)}</span>
        <button class="btn btn-danger btn-icon delete-session-btn" data-id="${session.id}" style="padding: 2px 6px; font-size:10px;">✕</button>
      </div>
      <div class="session-hostname">${escapeHtml(session.hostname)}</div>
      <div class="session-meta">
        <span class="session-date">${dateFormatted}</span>
      </div>
    `;

    // Click to view logs
    item.addEventListener("click", (e) => {
      // If clicked the delete button, prevent trigger
      if (e.target.classList.contains("delete-session-btn")) {
        return;
      }
      selectSession(session);
    });

    // Delete button logic
    const deleteBtn = item.querySelector(".delete-session-btn");
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete session "${session.name}" and all of its visitor logs?`)) {
        await db.deleteSession(session.id);
        if (selectedSession && selectedSession.id === session.id) {
          selectedSession = null;
          if (logPollingInterval) clearInterval(logPollingInterval);
        }
        await loadSessions();
      }
    });

    sessionsListContainer.appendChild(item);
  });
}

// Select a session to view details
function selectSession(session) {
  selectedSession = session;
  
  // Update sidebar active classes
  const items = sessionsListContainer.querySelectorAll(".session-item");
  sessions.forEach((s, idx) => {
    if (s.id === session.id) {
      items[idx].classList.add("active");
    } else {
      items[idx].classList.remove("active");
    }
  });

  // Update Detail UI
  activeDetailState.style.display = "block";

  activeSessionName.textContent = session.name;
  activeSessionHost.textContent = session.hostname;
  activeSessionRedirect.textContent = session.redirect;

  // Construct Target Link
  const origin = window.location.origin;
  activeLinkUrl.textContent = `${origin}/index.html?s=${session.id}`;

  // Load Logs immediately
  loadLogs(session.id);

  // Start automatic polling/refresh of logs (every 4 seconds)
  if (logPollingInterval) {
    clearInterval(logPollingInterval);
  }
  logPollingInterval = setInterval(() => {
    loadLogs(session.id);
  }, 4000);
}

// Fetch and render visitor records
async function loadLogs(sessionId) {
  try {
    const logs = await db.getLogs(sessionId);
    renderLogs(logs);
  } catch (err) {
    console.error("Error loading logs:", err);
  }
}

function renderLogs(logs) {
  logsTableBody.innerHTML = "";
  
  if (logs.length === 0) {
    noLogsState.style.display = "flex";
    logsTableBody.parentElement.style.display = "none";
    return;
  }

  noLogsState.style.display = "none";
  logsTableBody.parentElement.style.display = "table";

  logs.forEach(log => {
    const tr = document.createElement("tr");
    const timeFormatted = new Date(log.timestamp).toLocaleString();
    
    const visitorContent = log.label
      ? `
        <div class="visitor-label-container">
          <span class="visitor-alias">${escapeHtml(log.label)}</span>
          <span class="visitor-ip-sub">${escapeHtml(log.ip || "Unknown")}</span>
        </div>
      `
      : `
        <div class="visitor-label-container">
          <span class="ip-address" style="font-size: 11.5px; margin-bottom: 4px; display: inline-block;">${escapeHtml(log.ip || "Unknown")}</span>
          <span class="add-label-tag">+ Label</span>
        </div>
      `;

    tr.innerHTML = `
      <td><span class="timestamp">${timeFormatted}</span></td>
      <td>${visitorContent}</td>
      <td><span style="font-family: monospace; color: var(--text-muted);">${escapeHtml(log.rayId || "N/A")}</span></td>
      <td><span class="status-badge verified">Verified</span></td>
      <td style="max-width: 320px;">
        <div style="font-weight: 500; font-size:11px; margin-bottom: 2px; color: var(--accent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="Referrer">
          Ref: ${escapeHtml(log.referrer || "Direct")}
        </div>
        <div style="color: var(--text-muted); font-size:11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(log.userAgent || "Unknown")}">
          UA: ${escapeHtml(log.userAgent || "Unknown")}
        </div>
      </td>
      <td style="text-align: center;">
        <button class="delete-log-btn" title="Delete record">🗑️</button>
      </td>
    `;
    
    // Clicking the row opens the details inspector
    tr.addEventListener("click", () => openLogModal(log));
    
    // Add event listener to delete button with propagation stopped
    const rowDeleteBtn = tr.querySelector(".delete-log-btn");
    rowDeleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation(); // prevent modal opening
      if (confirm(`Are you sure you want to delete visitor record for ${log.ip || "Unknown"}?`)) {
        try {
          await db.deleteLog(selectedSession.id, log.id);
          await loadLogs(selectedSession.id);
        } catch (err) {
          console.error("Failed to delete log:", err);
          alert("Error: " + err.message);
        }
      }
    });

    // Add event listener to the + Label tag if present
    const addLabelTag = tr.querySelector(".add-label-tag");
    if (addLabelTag) {
      addLabelTag.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent double modal opening
        openLogModal(log);
        // Focus the label input automatically
        setTimeout(() => {
          if (detailLabelInput) detailLabelInput.focus();
        }, 100);
      });
    }

    logsTableBody.appendChild(tr);
  });
}

// Helper functions

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
