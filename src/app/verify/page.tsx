"use client";

import { useEffect, useState } from "react";
import VerifyClient from "@/components/VerifyClient";
import type { Campaign } from "@/types";

const DEFAULT_HOSTNAME = process.env.NEXT_PUBLIC_DEFAULT_HOSTNAME || "example.com";
const DEFAULT_REDIRECT_URL =
  process.env.NEXT_PUBLIC_DEFAULT_REDIRECT_URL || "https://cloudflare.com";

export default function VerifyPage() {
  const [sessionId, setSessionId] = useState("");
  const [hostname, setHostname] = useState(DEFAULT_HOSTNAME);
  const [redirectUrl, setRedirectUrl] = useState(DEFAULT_REDIRECT_URL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentSessionId = params.get("s") || "";
    setSessionId(currentSessionId);

    if (!currentSessionId) {
      setReady(true);
      return;
    }

    import("@/lib/firebase").then(({ db }) => {
      db.getSession(currentSessionId).then((session) => {
        const typedSession = session as Campaign | null;

        if (typedSession) {
          if (typeof typedSession.hostname === "string" && typedSession.hostname.trim()) {
            setHostname(typedSession.hostname);
          }
          if (typeof typedSession.redirect === "string" && typedSession.redirect.trim()) {
            setRedirectUrl(typedSession.redirect);
          }
        }
        setReady(true);
      });
    });
  }, []);

  if (!ready || !sessionId) {
    return null;
  }

  return <VerifyClient sessionId={sessionId} hostname={hostname} redirectUrl={redirectUrl} />;
}
