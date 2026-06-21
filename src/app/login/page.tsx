"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !password.trim()) return;

    setAuthError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = (await res.json()) as { error?: string; success?: boolean };

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      const mockUser = {
        uid: "authenticated-user",
        email: "admin@loc-phish.local",
        displayName: "Admin User",
        photoURL: "",
      };
      localStorage.setItem("mock_current_user", JSON.stringify(mockUser));

      const { triggerMockAuthStateChange } = await import("@/lib/firebase");
      triggerMockAuthStateChange(mockUser);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setAuthError(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>INITIALIZING SECURE SESSION...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.ambient}>
        <div className={styles.scanLine} />
        <svg style={{ position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px', opacity: 0.05 }} viewBox="0 0 100 100">
          <path d="M0 20 L20 20 L30 30 L30 50 L20 60 L0 60" stroke="var(--color-rose)" fill="none" strokeWidth="0.5" />
          <circle cx="30" cy="30" r="1" fill="var(--color-rose)" />
          <circle cx="30" cy="50" r="1" fill="var(--color-rose)" />
        </svg>
        <svg style={{ position: 'absolute', bottom: '15%', right: '8%', width: '300px', height: '300px', opacity: 0.03 }} viewBox="0 0 100 100">
          <path d="M100 80 L80 80 L70 70 L70 50 L80 40 L100 40" stroke="var(--color-rose)" fill="none" strokeWidth="0.5" />
          <circle cx="70" cy="70" r="1" fill="var(--color-rose)" />
        </svg>
      </div>

      <nav className={styles.loginNav}>
        <button onClick={() => router.push('/')} className={styles.backLink}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Return to Research</span>
        </button>
      </nav>

      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="var(--color-rose)"
            strokeWidth="1.5"
            style={{ opacity: 0.8 }}
          >
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className={styles.title}>Secure Access</h2>
        <p className={styles.subtitle}>
          Authorized personnel only.
        </p>

        <form onSubmit={handleLogin} className={styles.form}>
          <input
            ref={inputRef}
            type="password"
            className={styles.passwordInput}
            placeholder="Access password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "AUTHENTICATING..." : "ENTER"}
          </button>
        </form>

        {authError && <div className={styles.error}>{authError}</div>}
      </div>

      <footer className={styles.footer}>
        LP / AUTH — SECURE
      </footer>
    </div>
  );
}
