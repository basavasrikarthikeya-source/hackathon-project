"use client";

import React from "react";
import {
  Plus,
  Target,
  FileText,
  Layers,
  Command,
  PanelLeftClose,
  PanelLeft,
  Crosshair,
  Sparkles,
} from "lucide-react";
import { Project, Inspection } from "@/types/drishti";

interface DrishtiSidebarProps {
  currentProject: Project;
  inspections: Inspection[];
  activeInspectionId: string | null;
  onSelectInspection: (inspection: Inspection) => void;
  onNewInspection: () => void;
  onOpenProjectLibrary: () => void;
  onOpenCommands: () => void;
  onOpenAuth: () => void;
  userEmail: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function DrishtiSidebar({
  currentProject,
  inspections,
  activeInspectionId,
  onSelectInspection,
  onNewInspection,
  onOpenProjectLibrary,
  onOpenCommands,
  onOpenAuth,
  userEmail,
  isOpen,
  onToggleOpen,
}: DrishtiSidebarProps) {
  if (!isOpen) {
    return (
      <aside className="w-14 border-r border-white/5 bg-[#090616]/85 backdrop-blur-xl flex flex-col items-center py-4 select-none z-20">
        <button
          onClick={onToggleOpen}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Expand sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNewInspection}
          className="mt-4 w-9 h-9 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center justify-center text-neutral-950 shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:scale-105 transition-all cursor-pointer"
          title="New inspection"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onOpenProjectLibrary}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer mb-2"
          title="Project library"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenCommands}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer mb-2"
          title="Commands (⌘K)"
        >
          <Command className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenAuth}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
          title={userEmail || "Analyst Workspace"}
        >
          D
        </button>
      </aside>
    );
  }

  // Filter inspections by group
  const pinnedInspections = inspections.filter((i) => i.group === "PINNED");
  const todayInspections = inspections.filter((i) => i.group === "TODAY");
  const yesterdayInspections = inspections.filter(
    (i) => i.group === "YESTERDAY"
  );

  return (
    <aside className="w-64 sm:w-72 border-r border-white/5 bg-[#090616]/85 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-20 select-none transition-all">
      {/* Top Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-neutral-950 font-bold text-xs shadow-[0_0_10px_rgba(0,242,254,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            Drishti
          </span>
        </div>
        <button
          onClick={onToggleOpen}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Inspection Button */}
      <div className="p-3.5 pb-2">
        <button
          onClick={onNewInspection}
          className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#050510] font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New inspection</span>
        </button>
      </div>

      {/* Project Banner Display */}
      <div className="px-4 py-2.5 border-b border-white/5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Project
        </div>
        <div
          onClick={onOpenProjectLibrary}
          className="cursor-pointer group mt-0.5"
          title="Click to view all projects"
        >
          <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
            {currentProject.name}
          </div>
          <div className="text-[11px] text-neutral-400 truncate">
            {currentProject.location}
          </div>
        </div>
      </div>

      {/* Inspection History List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {/* Pinned Group */}
        {pinnedInspections.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Pinned
            </div>
            {pinnedInspections.map((item) => {
              const isActive = activeInspectionId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectInspection(item)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-xs transition-all cursor-pointer group ${
                    isActive
                      ? "bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 shadow-[0_0_10px_rgba(0,242,254,0.15)]"
                      : "text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Crosshair className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-300 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 shrink-0 pl-1">
                    {item.timeAgo}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Today Group */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Today
          </div>
          {todayInspections.length === 0 ? (
            <div className="px-2 text-[11px] text-neutral-600 italic">
              No analyses yet today
            </div>
          ) : (
            todayInspections.map((item) => {
              const isActive = activeInspectionId === item.id;
              const isAudit = item.title.includes("Audit");
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectInspection(item)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-xs transition-all cursor-pointer group ${
                    isActive
                      ? "bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 shadow-[0_0_10px_rgba(0,242,254,0.15)]"
                      : "text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isAudit ? (
                      <FileText className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-300 shrink-0" />
                    ) : (
                      <Target className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-300 shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 shrink-0 pl-1">
                    {item.timeAgo}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Yesterday Group */}
        {yesterdayInspections.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Yesterday
            </div>
            {yesterdayInspections.map((item) => {
              const isActive = activeInspectionId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectInspection(item)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-xs transition-all cursor-pointer group ${
                    isActive
                      ? "bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 shadow-[0_0_10px_rgba(0,242,254,0.15)]"
                      : "text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Target className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-300 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 shrink-0 pl-1">
                    {item.timeAgo}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          onClick={onOpenProjectLibrary}
          className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Layers className="w-4 h-4 text-neutral-400" />
          <span>Project library</span>
        </button>

        <button
          onClick={onOpenCommands}
          className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Command className="w-4 h-4 text-neutral-400" />
            <span>Commands</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-neutral-300 font-mono">
            ⌘K
          </span>
        </button>

        {/* User Workspace Profile */}
        <div
          onClick={onOpenAuth}
          className="pt-2 mt-1 border-t border-white/5 flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Analyst profile & credentials"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
            D
          </div>
          <div className="flex-1 truncate">
            <div className="text-xs font-medium text-white truncate">
              {userEmail ? userEmail.split("@")[0] : "Analyst Workspace"}
            </div>
            <div className="text-[10px] text-neutral-400">Drishti Studio</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
