import { db } from "../firebase-config.js";

// Vite-injected environment variables (loaded from .env / .env.local / Vercel dashboard at build-time)
const DEFAULT_HOSTNAME = import.meta.env.VITE_DEFAULT_HOSTNAME || "example.com";
const DEFAULT_REDIRECT_URL = import.meta.env.VITE_DEFAULT_REDIRECT_URL || "https://cloudflare.com";

// Get URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("s");

let currentHost = DEFAULT_HOSTNAME;
let targetRedirectUrl = urlParams.get("redirect") || DEFAULT_REDIRECT_URL;
let isSessionValid = false;

// Load Session details if session ID is provided
async function initSession() {
  if (sessionId) {
    try {
      const session = await db.getSession(sessionId);
      if (session) {
        currentHost = session.hostname;
        targetRedirectUrl = session.redirect;
        isSessionValid = true;
      }
    } catch (err) {
      console.error("Error loading session:", err);
    }
  }
  document.getElementById("hostname-placeholder").textContent = currentHost;
}
initSession();

// Generate Ray ID
const generateRayID = () => {
  const chars = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};
const rayId = generateRayID();
document.getElementById("ray-id").textContent = rayId;

// Dynamically fetch public IP address (falls back to mock IP if failed/blocked)
const clientIpSpan = document.getElementById("client-ip");

function parseTraceIP(text) {
  const lines = text.trim().split("\n");
  const ipLine = lines.find(line => line.startsWith("ip="));
  return ipLine ? ipLine.split("=")[1] : null;
}

function generateMockIP() {
  // Create a plausible IPv4 address
  const o1 = Math.floor(Math.random() * 223) + 1;
  const o2 = Math.floor(Math.random() * 255);
  const o3 = Math.floor(Math.random() * 255);
  const o4 = Math.floor(Math.random() * 254) + 1;
  clientIpSpan.textContent = `${o1}.${o2}.${o3}.${o4}`;
}

function fetchIpify() {
  // Try api64.ipify.org first (supports both IPv4 and IPv6)
  fetch("https://api64.ipify.org?format=json")
    .then(response => response.json())
    .then(data => {
      if (data && data.ip) {
        clientIpSpan.textContent = data.ip;
      } else {
        throw new Error("api64.ipify failed");
      }
    })
    .catch(() => {
      // Fallback to freeipapi.com
      fetch("https://freeipapi.com/api/json")
        .then(response => response.json())
        .then(data => {
          if (data && data.ipAddress) {
            clientIpSpan.textContent = data.ipAddress;
          } else {
            throw new Error("freeipapi failed");
          }
        })
        .catch(() => {
          // Second fallback to ipapi.co
          fetch("https://ipapi.co/json/")
            .then(response => response.json())
            .then(data => {
              if (data && data.ip) {
                clientIpSpan.textContent = data.ip;
              } else {
                generateMockIP();
              }
            })
            .catch(() => {
              generateMockIP();
            });
        });
    });
}

function fetchGlobalTrace() {
  fetch("https://www.cloudflare.com/cdn-cgi/trace")
    .then(response => response.text())
    .then(text => {
      const ip = parseTraceIP(text);
      if (ip) clientIpSpan.textContent = ip;
      else throw new Error("Global trace output invalid");
    })
    .catch(() => {
      fetchIpify();
    });
}

function fetchRelativeTrace() {
  fetch("/cdn-cgi/trace")
    .then(response => response.text())
    .then(text => {
      const ip = parseTraceIP(text);
      if (ip) clientIpSpan.textContent = ip;
      else throw new Error("Trace output invalid");
    })
    .catch(() => {
      fetchGlobalTrace();
    });
}

// Prevent CORS errors on localhost or local file protocol by checking hostname/protocol
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
if (isLocal) {
  fetchIpify();
} else {
  fetchRelativeTrace();
}

// Interactive Widget Actions
const turnstileWidget = document.getElementById("turnstileWidget");
const widgetLabel = document.getElementById("widgetLabel");
const exitOverlay = document.getElementById("exitOverlay");
let verifying = false;

function startVerification() {
  if (verifying) return;
  verifying = true;

  // Update widget styles
  turnstileWidget.classList.add("state-checking");
  turnstileWidget.setAttribute("aria-checked", "mixed");
  widgetLabel.textContent = "Verifying...";

  // Standard Turnstile delay (approx 1.5 - 2s)
  setTimeout(() => {
    completeVerification();
  }, 1600);
}

async function completeVerification() {
  turnstileWidget.classList.remove("state-checking");
  turnstileWidget.classList.add("state-success");
  turnstileWidget.setAttribute("aria-checked", "true");
  widgetLabel.textContent = "Success!";

  // Log the visit to database if it's a valid tracking session
  if (isSessionValid && sessionId) {
    try {
      await db.logVisit(sessionId, {
        ip: clientIpSpan.textContent,
        rayId: rayId,
        userAgent: navigator.userAgent,
        referrer: document.referrer || "Direct"
      });
    } catch (err) {
      console.error("Failed to log visit:", err);
    }
  }
  
  // Post-verification exit transition
  setTimeout(() => {
    exitOverlay.classList.add("active");
    
    setTimeout(() => {
      window.location.href = targetRedirectUrl;
    }, 1200);
  }, 600);
}

// Click & Keyboard Event Listeners
turnstileWidget.addEventListener("click", startVerification);
turnstileWidget.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    startVerification();
  }
});
