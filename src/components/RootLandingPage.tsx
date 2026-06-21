"use client";

import Link from "next/link";
import styles from "./RootLandingPage.module.css";

export default function RootLandingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.ambient}>
        <div className={styles.glow} />
        <div className={styles.scanLine} />
      </div>

      <nav className={styles.nav}>
        <div className={styles.logo}>
          LP <span style={{ opacity: 0.2 }}>/</span> RESEARCH
        </div>
      </nav>

      <main className={styles.hero}>
        <h1 className={styles.title}>
          <span className={styles.titleSpan}>PHISH</span>
          OPS—01
        </h1>
        
        <p className={styles.subtitle}>
          A modular phishing framework for controlled location assessment simulations.
        </p>

        <Link href="/dashboard" className={styles.getStartedBtn}>
          <span className={styles.btnInner}>Get Started</span>
        </Link>
      </main>

      <footer className={styles.footer}>
        <span>© 2026 LOC-PHISH</span>
      </footer>
    </div>
  );
}
