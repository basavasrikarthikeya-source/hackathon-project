"use client";

import React from "react";
import { Sparkles, Split, Compass, Globe, Radio } from "lucide-react";
import { Project, Inspection } from "@/types/drishti";

interface DrishtiHeaderProps {
  currentProject: Project;
  activeInspection: Inspection | null;
  currentView: "projects" | "inspection";
  mode: "interactive" | "comparison";
  onSelectMode: (mode: "interactive" | "comparison") => void;
  onOpenAbout: () => void;
  onNavigateProjects: () => void;
  isEngineOnline: boolean;
}

export function DrishtiHeader({
  currentProject,
  activeInspection,
  currentView,
  mode,
  onSelectMode,
  onOpenAbout,
  onNavigateProjects,
  isEngineOnline,
}: DrishtiHeaderProps) {
  const isMock =
    !process.env.NEXT_PUBLIC_GRADIO_URL ||
    process.env.NEXT_PUBLIC_GRADIO_URL === "mock";

  return (
    <header className="h-14 border-b border-white/5 bg-[#0b071a]/70 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Logo & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Logo Badge */}
        <button
          onClick={onNavigateProjects}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
          title="Return to Projects Overview"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 via-teal-400 to-indigo-500 p-[1.5px] shadow-[0_0_15px_rgba(0,242,254,0.3)] group-hover:shadow-[0_0_20px_rgba(0,242,254,0.5)] transition-all">
            <div className="w-full h-full bg-[#0a0718] rounded-[6.5px] flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-300 transition-colors">
            Drishti
          </span>
        </button>

        {/* Breadcrumb Path */}
        <div className="hidden sm:flex items-center text-xs text-neutral-400 gap-1.5 pl-2">
          <span className="text-neutral-600">/</span>
          <button
            onClick={onNavigateProjects}
            className="hover:text-white transition-colors cursor-pointer max-w-[200px] truncate"
            title="Switch project"
          >
            {currentProject.name}
          </button>
          <span className="text-neutral-600">&gt;</span>
          <span className="text-neutral-200 font-medium max-w-[220px] truncate">
            {currentView === "projects"
              ? "Inspection"
              : activeInspection
              ? activeInspection.title
              : "Inspection"}
          </span>
        </div>
      </div>

      {/* Right: Mode Switchers & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Interactive Mode Button */}
        <button
          onClick={() => onSelectMode("interactive")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            mode === "interactive"
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.25)]"
              : "text-neutral-400 hover:text-neutral-200 border border-transparent hover:border-white/10 hover:bg-white/5"
          }`}
          title="Single satellite image query and feature detection"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive</span>
        </button>

        {/* Comparison Mode Button */}
        <button
          onClick={() => onSelectMode("comparison")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            mode === "comparison"
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.25)]"
              : "text-neutral-400 hover:text-neutral-200 border border-white/10 hover:border-white/20 hover:bg-white/5"
          }`}
          title="Bi-temporal change detection (Before T1 vs After T2)"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Comparison</span>
        </button>

        {/* About Button */}
        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
          title="About Drishti Satellite Intelligence & Kaggle Worker Architecture"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>About</span>
        </button>

        {/* Engine Status Indicator */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ml-1 ${
            !isEngineOnline
              ? "bg-red-950/40 border-red-500/30 text-red-300"
              : isMock
              ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
              : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
          }`}
          title={
            !isEngineOnline
              ? "Backend is offline"
              : isMock
              ? "Simulated AI Worker Ready"
              : "Kaggle GPU Worker Online"
          }
        >
          <Radio className={`w-3 h-3 ${isEngineOnline ? "animate-pulse" : ""}`} />
          <span>{isMock ? "Mock Engine" : "Worker Live"}</span>
        </div>
      </div>
    </header>
  );
}
