"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Compass,
  Split,
  Sparkles,
  Layers,
  FileText,
  Droplets,
  Trees,
  X,
} from "lucide-react";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewInspection: () => void;
  onSelectProject: (projectName: string) => void;
  onSelectPresetQuery: (query: string) => void;
  onToggleMode: (mode: "interactive" | "comparison") => void;
  onOpenAbout: () => void;
  onOpenProjectLibrary: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onNewInspection,
  onSelectProject,
  onSelectPresetQuery,
  onToggleMode,
  onOpenAbout,
  onOpenProjectLibrary,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    {
      id: "new-inspection",
      title: "Start New Inspection",
      category: "Action",
      icon: Plus,
      action: () => {
        onNewInspection();
        onClose();
      },
    },
    {
      id: "mode-interactive",
      title: "Switch to Interactive Mode (Single Image)",
      category: "Mode",
      icon: Sparkles,
      action: () => {
        onToggleMode("interactive");
        onClose();
      },
    },
    {
      id: "mode-compare",
      title: "Switch to Comparison Mode (Before / After)",
      category: "Mode",
      icon: Split,
      action: () => {
        onToggleMode("comparison");
        onClose();
      },
    },
    {
      id: "query-water",
      title: "Detect water bodies and flood breach zones",
      category: "Suggested Query",
      icon: Droplets,
      action: () => {
        onSelectPresetQuery(
          "Detect water bodies, flood inundation extent, and shoreline breach zones."
        );
        onClose();
      },
    },
    {
      id: "query-buildings",
      title: "Count building footprints and unauthorized construction",
      category: "Suggested Query",
      icon: FileText,
      action: () => {
        onSelectPresetQuery(
          "Count and identify all building footprints and detect unauthorized construction."
        );
        onClose();
      },
    },
    {
      id: "query-canopy",
      title: "Measure canopy coverage and deforestation",
      category: "Suggested Query",
      icon: Trees,
      action: () => {
        onSelectPresetQuery(
          "Measure tree canopy coverage, foliage density tracking, and vegetation loss."
        );
        onClose();
      },
    },
    {
      id: "proj-amaravati",
      title: "Go to Amaravati Flood Plain",
      category: "Projects",
      icon: Layers,
      action: () => {
        onSelectProject("Amaravati Flood Plain");
        onClose();
      },
    },
    {
      id: "proj-sundarbans",
      title: "Go to Sundarbans Biosphere Reserve",
      category: "Projects",
      icon: Layers,
      action: () => {
        onSelectProject("Sundarbans Biosphere Reserve");
        onClose();
      },
    },
    {
      id: "proj-bengaluru",
      title: "Go to Bengaluru Tech Corridor Expansion",
      category: "Projects",
      icon: Layers,
      action: () => {
        onSelectProject("Bengaluru Tech Corridor Expansion");
        onClose();
      },
    },
    {
      id: "project-library",
      title: "Open Satellite Project Library",
      category: "Navigation",
      icon: Layers,
      action: () => {
        onOpenProjectLibrary();
        onClose();
      },
    },
    {
      id: "about-drishti",
      title: "About Drishti Architecture & Kaggle Worker",
      category: "Help",
      icon: Compass,
      action: () => {
        onOpenAbout();
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#140e32] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-white/10 flex items-center gap-3">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No matching commands.
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 text-neutral-400 group-hover:text-cyan-300 shrink-0" />
                    <span className="truncate">{cmd.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500 px-4">
          <span>Navigate with arrows &bull; Press Enter to select</span>
          <span className="font-mono">ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
