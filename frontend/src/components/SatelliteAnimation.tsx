import React from 'react';

interface SatelliteAnimationProps {
  className?: string;
  size?: number;
}

export const SatelliteAnimation: React.FC<SatelliteAnimationProps> = ({
  className = '',
  size = 28
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Orbital Elliptical Ring with slow dash rotation */}
      <svg
        className="w-full h-full animate-[spin_12s_linear_infinite]"
        viewBox="0 0 32 32"
        fill="none"
      >
        <ellipse
          cx="16"
          cy="16"
          rx="13.5"
          ry="6"
          stroke="#22D3EE"
          strokeOpacity="0.3"
          strokeWidth="1"
          strokeDasharray="2 3"
          transform="rotate(-28 16 16)"
        />
      </svg>

      {/* Floating Satellite Icon with gentle pulse/glow */}
      <div className="absolute inset-0 flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
        <svg
          className="w-4 h-4 text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Top-left solar panel */}
          <path d="M13 7 9 3 5 7l4 4" />
          {/* Bottom-right solar panel */}
          <path d="m17 11 4 4-4 4-4-4" />
          {/* Main body */}
          <path d="m8 12 4 4 6-6-4-4Z" />
          {/* Panel connection struts */}
          <path d="m16 8 3-3" />
          <path d="m9 15-3 3" />
          {/* Center dish focal node */}
          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        </svg>
      </div>

      {/* Sensor telemetry ping wave */}
      <span className="absolute w-2 h-2 rounded-full bg-[#22D3EE]/40 animate-ping pointer-events-none" />
    </div>
  );
};
