"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setLoading(false);
      if (user) {
        router.replace("/dashboard");
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [router]);

  const handleGoogleSignIn = async () => {
    setAuthError("");
    try {
      await auth.loginWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setAuthError(message);
    }
  };

  return (
    <>
      {/* Technical Background Traces */}
      <div className="tech-bg">
        <div className="grid-overlay" />
        <svg
          className="circuit-svg left-circuit"
          viewBox="0 0 400 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50,200 L150,200 L200,250 L200,450 L150,500 L-50,500"
            stroke="rgba(224, 169, 140, 0.08)"
            strokeWidth="1.5"
          />
          <path
            d="M-50,205 L148,205 L196,253 L196,447 L148,495 L-50,495"
            stroke="rgba(0, 136, 255, 0.05)"
            strokeWidth="1"
          />
          <circle cx="200" cy="350" r="4" fill="#0077ff" opacity="0.6" />
          <circle cx="150" cy="200" r="3" fill="#e0a98c" />
          <circle cx="150" cy="500" r="3" fill="#e0a98c" />
        </svg>
        <svg
          className="circuit-svg right-circuit"
          viewBox="0 0 400 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M450,200 L250,200 L200,250 L200,450 L250,500 L450,500"
            stroke="rgba(224, 169, 140, 0.08)"
            strokeWidth="1.5"
          />
          <path
            d="M450,205 L252,205 L204,253 L204,447 L252,495 L450,495"
            stroke="rgba(0, 136, 255, 0.05)"
            strokeWidth="1"
          />
          <circle cx="200" cy="350" r="4" fill="#0077ff" opacity="0.6" />
          <circle cx="250" cy="200" r="3" fill="#e0a98c" />
          <circle cx="250" cy="500" r="3" fill="#e0a98c" />
        </svg>
      </div>

      {/* Header */}
      <header>
        <div className="logo-container">
          <span className="logo-icon">🛡️</span>
          <span className="logo-text">loc-phish</span>
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="loading-screen">
          <div className="loading-text">Loading secure portal...</div>
        </div>
      )}

      {/* Auth Screen */}
      {!loading && (
        <div className="auth-container">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                border: "2px solid rgba(224, 169, 140, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "-3px",
                  borderRadius: "50%",
                  border: "2px solid transparent",
                  borderTopColor: "#e0a98c",
                  borderBottomColor: "rgba(224, 169, 140, 0.2)",
                  animation: "spin 3s linear infinite",
                }}
              />
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#e0a98c"
                strokeWidth="1.5"
              >
                <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
                <circle cx="12" cy="12" r="4" strokeDasharray="2 2" />
                <circle cx="12" cy="12" r="1.5" fill="#e0a98c" />
              </svg>
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "8px",
                background: "linear-gradient(135deg, #ffffff 30%, #e0a98c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Secure Portal Access
            </h2>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "13px",
                maxWidth: "300px",
                lineHeight: 1.5,
              }}
            >
              Authenticate via Google to access the phish simulation campaign control room.
            </p>
          </div>

          <div>
            <button type="button" className="btn-google" onClick={handleGoogleSignIn}>
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
            {authError && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--color-error-bg)",
                  border: "1px solid rgba(248, 113, 113, 0.2)",
                  color: "var(--color-error)",
                  fontSize: "13px",
                }}
              >
                {authError}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
