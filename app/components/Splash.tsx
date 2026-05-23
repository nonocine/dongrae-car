"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SESSION_KEY = "dongrae_splash_shown";
const VISIBLE_MS = 1800;
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
        background: "#fafaf5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: phase === "fading" ? "none" : "auto",
        overflow: "hidden",
      }}
    >
      <Image
        src="/images/dongrae-logo.png"
        alt="동래구청소년센터"
        width={260}
        height={75}
        priority
        style={{ width: 260, height: "auto", objectFit: "contain" }}
      />

      <div
        style={{
          position: "relative",
          width: "min(80vw, 360px)",
          height: 80,
          overflow: "hidden",
        }}
      >
        {/* Road */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 8,
            height: 16,
            background: "#d1d5db",
            borderRadius: 4,
          }}
        />
        {/* Lane dashes */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 14,
            height: 2,
            backgroundImage:
              "repeating-linear-gradient(to right, #f9fafb 0 12px, transparent 12px 24px)",
          }}
        />

        {/* Car */}
        <div className="dongrae-car-wrap">
          {/* Exhaust puffs */}
          <span className="dongrae-puff" style={{ animationDelay: "0s" }} />
          <span className="dongrae-puff" style={{ animationDelay: "0.25s", left: -14 }} />
          <span className="dongrae-puff" style={{ animationDelay: "0.5s", left: -22 }} />

          <svg
            viewBox="0 0 120 60"
            width="110"
            height="55"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* body shadow */}
            <ellipse cx="60" cy="55" rx="42" ry="3" fill="rgba(0,0,0,0.12)" />

            {/* Lower body */}
            <path
              d="M10 42 Q12 32 22 30 L36 30 L46 18 Q50 14 58 14 L82 14 Q92 14 96 22 L104 30 L108 32 Q114 33 114 40 L114 46 Q114 48 112 48 L8 48 Q6 48 6 46 L6 44 Q6 42 10 42 Z"
              fill="#4269a1"
            />
            {/* Roof */}
            <path
              d="M44 30 L50 18 Q53 16 58 16 L82 16 Q90 16 93 23 L96 30 Z"
              fill="#2c4774"
            />
            {/* Front window */}
            <path
              d="M52 28 L55.5 20 Q57 18.5 60 18.5 L69 18.5 L69 28 Z"
              fill="#bde0f3"
            />
            {/* Rear window */}
            <path
              d="M71 18.5 L80 18.5 Q86 18.5 88 23 L91 28 L71 28 Z"
              fill="#bde0f3"
            />
            {/* Door line */}
            <line x1="70" y1="29" x2="70" y2="42" stroke="#2c4774" strokeWidth="0.8" />
            {/* Headlight */}
            <circle cx="109" cy="36" r="2.2" fill="#facc15" />
            {/* Taillight */}
            <rect x="8" y="34" width="3" height="3" rx="0.6" fill="#df483f" />

            {/* Wheel wells */}
            <circle cx="30" cy="46" r="11" fill="#1f2937" />
            <circle cx="92" cy="46" r="11" fill="#1f2937" />

            {/* Wheels (rotating) */}
            <g className="dongrae-wheel" style={{ transformOrigin: "30px 46px" }}>
              <circle cx="30" cy="46" r="8.5" fill="#374151" />
              <circle cx="30" cy="46" r="3.2" fill="#f9fafb" />
              <rect x="29.2" y="38.5" width="1.6" height="15" fill="#f9fafb" rx="0.3" />
              <rect
                x="22.5"
                y="45.2"
                width="15"
                height="1.6"
                fill="#f9fafb"
                rx="0.3"
              />
            </g>
            <g className="dongrae-wheel" style={{ transformOrigin: "92px 46px" }}>
              <circle cx="92" cy="46" r="8.5" fill="#374151" />
              <circle cx="92" cy="46" r="3.2" fill="#f9fafb" />
              <rect x="91.2" y="38.5" width="1.6" height="15" fill="#f9fafb" rx="0.3" />
              <rect
                x="84.5"
                y="45.2"
                width="15"
                height="1.6"
                fill="#f9fafb"
                rx="0.3"
              />
            </g>
          </svg>
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          color: "#64748b",
          fontWeight: 500,
          letterSpacing: "0.04em",
        }}
      >
        차량 운행일지
      </p>

      <style>{`
        .dongrae-car-wrap {
          position: absolute;
          left: 0;
          bottom: 14px;
          display: inline-flex;
          align-items: end;
          animation: dongraeCarDrive 1.6s ease-in-out forwards;
        }
        @keyframes dongraeCarDrive {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(calc(min(80vw, 360px) + 30px)); }
        }
        .dongrae-wheel {
          animation: dongraeWheelSpin 0.3s linear infinite;
        }
        @keyframes dongraeWheelSpin {
          to { transform: rotate(360deg); }
        }
        .dongrae-puff {
          position: absolute;
          left: -6px;
          bottom: 30px;
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          background: rgba(148, 163, 184, 0.6);
          animation: dongraePuff 0.9s ease-out infinite;
          opacity: 0;
        }
        @keyframes dongraePuff {
          0%   { opacity: 0;    transform: translate(0, 0) scale(0.6); }
          40%  { opacity: 0.7;  transform: translate(-10px, -4px) scale(1); }
          100% { opacity: 0;    transform: translate(-22px, -10px) scale(1.3); }
        }
      `}</style>
    </div>
  );
}
