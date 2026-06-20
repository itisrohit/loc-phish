"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/components/VerifyClient.module.css";

export default function RootLandingPage() {
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  };

  useEffect(() => {
    document.body.classList.add("verify-page-body");

    return () => {
      document.body.classList.remove("verify-page-body");
      clearTimers();
    };
  }, []);

  const startVerification = () => {
    if (verifying) return;
    setVerifying(true);

    const verifyTimer = window.setTimeout(() => {
      setVerifying(false);
      setSuccess(true);

      const exitTimer = window.setTimeout(() => {
        setExiting(true);
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

        <h1 className={styles.title}>Checking if the site connection is secure</h1>
        <div className={styles.subHeading}>
          <span>Website</span> needs to review the security of your connection before proceeding.
        </div>

        <div className={styles.turnstileContainer}>
          <div
            className={widgetStateClass}
            onClick={startVerification}
            role="checkbox"
            aria-checked={success ? "true" : verifying ? "mixed" : "false"}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                startVerification();
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

        <div className={styles.infoSection}>
          <h2 className={styles.infoTitle}>Why am I seeing this page?</h2>
          <p className={styles.infoText}>
            Requests from malicious applications can look like standard traffic. If you are a human
            and not a bot, you can continue by passing the verification check.
          </p>
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
          Cloudflare Ray ID: <span>---------</span> • Your IP: <span>Loading...</span>
        </div>
      </footer>

      <div className={exitOverlayClass}>
        <div className={styles.exitSpinner} />
        <div className={styles.exitText}>Connection secure. Redirecting...</div>
      </div>
    </div>
  );
}
