"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import styles from "./LoginPage.module.css";

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
        {/* Asymmetrical Technical Patterns */}
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
          Authorized personnel only. <br /> Initialize session via secure provider.
        </p>

        <button type="button" className={styles.googleBtn} onClick={handleGoogleSignIn}>
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="currentColor"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="currentColor"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="currentColor"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="currentColor"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {authError && <div className={styles.error}>{authError}</div>}
      </div>

      <footer className={styles.footer}>
        LP / AUTH — SECURE
      </footer>
    </div>
  );
}
