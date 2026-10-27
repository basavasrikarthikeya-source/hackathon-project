"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface OfflineBannerProps {
  onRetryCheck: () => void;
  isChecking: boolean;
}

export function OfflineBanner({ onRetryCheck, isChecking }: OfflineBannerProps) {
  return (
    <div className="bg-red-950/60 border-b border-red-500/30 px-4 py-3 text-red-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <span className="font-semibold text-white">AI Engine Offline: </span>
            The analysis worker session is unreachable or restarting. If on Kaggle, re-run cell 4 and ensure the tunnel URL is updated.
          </div>
        </div>
        <button
          onClick={onRetryCheck}
          disabled={isChecking}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-red-900/60 hover:bg-red-900 border border-red-500/40 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
          <span>Check Connection</span>
        </button>
      </div>
    </div>
  );
}
