"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SESSION_KEY = "dongrae_splash_shown";
const VISIBLE_MS = 1500;
const FADE_MS = 300;

export default function Splash() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "fading">("hidden");

  useEffect(() => {
    const alreadyShown =
      typeof window !== "undefined" &&
      window.sessionStorage?.getItem(SESSION_KEY) === "1";

    document.body.style.visibility = "visible";

    if (alreadyShown) return;

    setPhase("visible");
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}

    const fadeTimer = window.setTimeout(() => setPhase("fading"), VISIBLE_MS);
    const hideTimer = window.setTimeout(
      () => setPhase("hidden"),
      VISIBLE_MS + FADE_MS
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      <Image
        src="/images/dongrae-logo.png"
        alt="동래구청소년센터"
        width={120}
        height={120}
        priority
        style={{ width: 120, height: 120, objectFit: "contain" }}
      />
      <p
        style={{
          fontSize: 14,
          color: "#475569",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        차량 운행일지
      </p>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 4,
        }}
      >
        <span className="dongrae-splash-dot" />
        <span className="dongrae-splash-dot" style={{ animationDelay: "0.15s" }} />
        <span className="dongrae-splash-dot" style={{ animationDelay: "0.3s" }} />
      </div>
      <style>{`
        .dongrae-splash-dot {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: #1a5fb4;
          display: inline-block;
          animation: dongraeSplashPulse 0.9s ease-in-out infinite;
          opacity: 0.4;
        }
        @keyframes dongraeSplashPulse {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
