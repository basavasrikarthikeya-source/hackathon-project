"use client";

import React from "react";
import { X, ShieldCheck, Cpu, Database, Radio, Globe } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEngineOnline: boolean;
}

export function AboutModal({ isOpen, onClose, isEngineOnline }: AboutModalProps) {
  if (!isOpen) return null;

  const gradioUrl = process.env.NEXT_PUBLIC_GRADIO_URL || "mock";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "Connected";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#140e32] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(0,242,254,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-500 p-[1.5px]">
              <div className="w-full h-full bg-[#0a0718] rounded-[6.5px] flex items-center justify-center">
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                DRISHTI <span className="text-neutral-400 font-normal">/ SatQuery</span>
              </h3>
              <p className="text-xs text-neutral-400">
                ST-09 Chakravyuh 2026 &bull; Satellite Intelligence Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-neutral-300 leading-relaxed">
          {/* Mission Doctrine */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-400/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-cyan-200 text-xs uppercase tracking-wider">
                Government Officer Doctrine: Model Flags, Humans Decide
              </h4>
              <p className="text-xs text-neutral-300">
                Drishti accelerates imagery triage by automatically detecting water bodies,
                canopy loss, and unpermitted structures. Every AI annotation is advisory;
                final operational actions require human verification.
              </p>
            </div>
          </div>

          {/* Architecture Pillars */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              System Architecture (Locked Contract v1.0)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-white text-xs">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Kaggle GPU Worker</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Runs Qwen2.5-VL-7B-Instruct with 6px red bounding box annotation engine.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-white text-xs">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Data Layer</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Postgres + Storage + Realtime. Browser never connects directly to Kaggle GPU.
                </p>
              </div>
            </div>
          </div>

          {/* Active Endpoints */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Command Channel (Doorbell):</span>
              <span className="font-mono text-cyan-300 truncate max-w-[240px]">
                {gradioUrl}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Data Channel (Supabase):</span>
              <span className="font-mono text-emerald-300 truncate max-w-[240px]">
                {supabaseUrl}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Engine Status:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isEngineOnline ? "text-emerald-400" : "text-red-400"
                }`}
              >
                <Radio className="w-3 h-3 animate-pulse" />
                {isEngineOnline ? "Connected & Ready" : "Offline"}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500 text-center pt-1">
            Chakravyuh 2026 National Hackathon &bull; Team Drishti
          </p>
        </div>
      </div>
    </div>
  );
}
