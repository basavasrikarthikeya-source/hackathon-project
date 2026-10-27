"use client";

import React from "react";

export function CosmicBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Deep Space Dark Foundation */}
      <div className="absolute inset-0 bg-[#070312]" />

      {/* Cosmic Nebula Gradients */}
      {/* Top Center-Right Violet Nebula */}
      <div
        className="absolute -top-[10%] left-[20%] w-[65vw] h-[65vw] rounded-full opacity-40 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(147, 51, 234, 0.45) 0%, rgba(126, 34, 206, 0.2) 50%, transparent 70%)",
        }}
      />

      {/* Center-Left Vibrant Magenta Swirl */}
      <div
        className="absolute top-[25%] -left-[10%] w-[55vw] h-[55vw] rounded-full opacity-35 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(219, 39, 119, 0.4) 0%, rgba(168, 85, 247, 0.2) 45%, transparent 70%)",
        }}
      />

      {/* Bottom Center Bright Nebula Dust */}
      <div
        className="absolute -bottom-[15%] left-[25%] w-[60vw] h-[50vw] rounded-full opacity-35 blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(192, 38, 211, 0.4) 0%, rgba(124, 58, 237, 0.25) 50%, transparent 75%)",
        }}
      />

      {/* Top Left Subtle Cyan Celestial Aura */}
      <div
        className="absolute -top-[15%] -left-[5%] w-[40vw] h-[40vw] rounded-full opacity-20 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%)",
        }}
      />

      {/* Twinkling Star Field (SVG overlay) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Fine Star Dust */}
        {[
          { cx: "8%", cy: "12%", r: 1.2, o: 0.8 },
          { cx: "15%", cy: "35%", r: 0.8, o: 0.6 },
          { cx: "22%", cy: "18%", r: 1.5, o: 0.9, glow: true },
          { cx: "29%", cy: "48%", r: 0.9, o: 0.5 },
          { cx: "36%", cy: "22%", r: 1.1, o: 0.7 },
          { cx: "42%", cy: "8%", r: 1.6, o: 0.85, glow: true },
          { cx: "48%", cy: "32%", r: 0.7, o: 0.4 },
          { cx: "55%", cy: "15%", r: 1.3, o: 0.75 },
          { cx: "62%", cy: "40%", r: 1.0, o: 0.6 },
          { cx: "68%", cy: "25%", r: 1.4, o: 0.8, glow: true },
          { cx: "75%", cy: "12%", r: 0.9, o: 0.5 },
          { cx: "82%", cy: "38%", r: 1.2, o: 0.7 },
          { cx: "89%", cy: "19%", r: 1.5, o: 0.9, glow: true },
          { cx: "94%", cy: "45%", r: 0.8, o: 0.5 },
          { cx: "12%", cy: "68%", r: 1.0, o: 0.6 },
          { cx: "18%", cy: "84%", r: 1.4, o: 0.75 },
          { cx: "27%", cy: "72%", r: 0.8, o: 0.5 },
          { cx: "34%", cy: "89%", r: 1.3, o: 0.8, glow: true },
          { cx: "45%", cy: "76%", r: 0.9, o: 0.5 },
          { cx: "52%", cy: "92%", r: 1.5, o: 0.85 },
          { cx: "63%", cy: "68%", r: 0.7, o: 0.4 },
          { cx: "70%", cy: "82%", r: 1.1, o: 0.7 },
          { cx: "84%", cy: "74%", r: 1.4, o: 0.8, glow: true },
          { cx: "91%", cy: "88%", r: 0.9, o: 0.6 },
          { cx: "5%", cy: "90%", r: 1.2, o: 0.7 },
          { cx: "58%", cy: "54%", r: 1.0, o: 0.65 },
          { cx: "79%", cy: "60%", r: 1.3, o: 0.75 },
        ].map((star, idx) => (
          <circle
            key={idx}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill="#ffffff"
            opacity={star.o}
            filter={star.glow ? "url(#starGlow)" : undefined}
          />
        ))}
      </svg>

      {/* Shaded Moon/Planet in lower right (as seen in Photo 2 and 3) */}
      <div
        className="absolute bottom-[20%] right-[28%] w-11 h-11 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-transform"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #7e799c 0%, #3e385c 40%, #1c1833 80%, #0d0a1c 100%)",
          boxShadow:
            "inset -4px -4px 8px rgba(0, 0, 0, 0.9), inset 2px 2px 4px rgba(255, 255, 255, 0.25), 0 0 16px rgba(168, 85, 247, 0.25)",
        }}
      />
    </div>
  );
}
