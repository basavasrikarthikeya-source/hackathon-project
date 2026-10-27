"use client";

import React from "react";
import { User, LogOut, Radio, Database, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  userEmail: string | null;
  isEngineOnline: boolean;
  onSignOut: () => void;
}

export function Header({ userEmail, isEngineOnline, onSignOut }: HeaderProps) {
  const isMock =
    !process.env.NEXT_PUBLIC_GRADIO_URL ||
    process.env.NEXT_PUBLIC_GRADIO_URL === "mock";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-950/30">
            <div className="w-full h-full bg-neutral-950 rounded-[11px] flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                DRISHTI <span className="text-neutral-400 font-normal">/ SatQuery</span>
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 rounded">
                ST-09 Chakravyuh
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Geospatial Visual Intelligence &bull; Model Flags, Humans Decide
            </p>
          </div>
        </div>

        {/* Engine status & User controls */}
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              !isEngineOnline
                ? "bg-red-950/40 border-red-500/30 text-red-300"
                : isMock
                ? "bg-amber-950/40 border-amber-500/30 text-amber-300"
                : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isEngineOnline ? "animate-pulse" : ""
              }`}
            />
            <span className="hidden md:inline">
              {!isEngineOnline
                ? "AI Engine Offline"
                : isMock
                ? "Simulation (Mock Mode)"
                : "Kaggle Worker Live"}
            </span>
            <span className="md:hidden">
              {!isEngineOnline ? "Offline" : isMock ? "Mock" : "Live"}
            </span>
          </div>

          {/* User badge & logout */}
          {userEmail && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span className="max-w-[140px] truncate">{userEmail}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
