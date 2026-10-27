"use client";

import React from "react";
import { TreePine, Building2, Waves, Sparkles } from "lucide-react";

interface PresetChipsProps {
  onSelectPreset: (prompt: string, defaultCompareMode: boolean) => void;
}

export function PresetChips({ onSelectPreset }: PresetChipsProps) {
  const presets = [
    {
      id: "uc1",
      title: "UC-1: Forest Protection Triage",
      desc: "Vegetation loss & illegal clearings",
      prompt: "Did anyone cut trees in this forest? Flag every clearing.",
      icon: TreePine,
      color: "hover:border-emerald-500/50 hover:bg-emerald-950/30 text-emerald-300",
      isCompare: true,
    },
    {
      id: "uc2",
      title: "UC-2: Urban Growth / Flood-Plain",
      desc: "New structures near water & basins",
      prompt: "Where are new structures near the flood basin? What changed?",
      icon: Building2,
      color: "hover:border-blue-500/50 hover:bg-blue-950/30 text-blue-300",
      isCompare: true,
    },
    {
      id: "uc3",
      title: "UC-3: Disaster (Flood) Response",
      desc: "Inundation, damaged roads & buildings",
      prompt: "Which areas are flooded? Flag damaged buildings and blocked roads.",
      icon: Waves,
      color: "hover:border-cyan-500/50 hover:bg-cyan-950/30 text-cyan-300",
      isCompare: false,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
        <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
        <span>Government Officer Mission Presets:</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {presets.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.prompt, p.isCompare)}
              className={`p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 text-left transition-all cursor-pointer group ${p.color}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                  {p.title}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-1">{p.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
