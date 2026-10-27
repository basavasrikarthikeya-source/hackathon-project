"use client";

import React, { useRef } from "react";
import { Plus, Send, Loader2, X } from "lucide-react";

interface FloatingInputBarProps {
  prompt: string;
  setPrompt: (p: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  hasImages: boolean;
  onAttachFile: (file: File) => void;
  placeholder?: string;
  beforeFile?: File | null;
  afterFile?: File | null;
  mode?: "interactive" | "comparison";
  onClearBefore?: () => void;
  onClearAfter?: () => void;
}

export function FloatingInputBar({
  prompt,
  setPrompt,
  onSubmit,
  isSubmitting,
  hasImages,
  onAttachFile,
  placeholder,
  beforeFile,
  afterFile,
  mode = "interactive",
  onClearBefore,
  onClearAfter,
}: FloatingInputBarProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-8 z-30 pointer-events-none flex flex-col items-center select-none">
      <div className="w-full max-w-3xl pointer-events-auto">
        {/* Attachment chips indicator */}
        {(beforeFile || afterFile) && (
          <div className="flex flex-wrap items-center gap-2 mb-2 px-3">
            {mode === "comparison" ? (
              <>
                {beforeFile ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] backdrop-blur-md">
                    <span>📷 Before (T1): {beforeFile.name.length > 20 ? beforeFile.name.slice(0, 18) + "..." : beforeFile.name}</span>
                    {onClearBefore && (
                      <button
                        type="button"
                        onClick={onClearBefore}
                        className="hover:text-white p-0.5 cursor-pointer"
                        title="Remove Before image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-neutral-800/80 border border-neutral-700/50 text-neutral-400 text-[10px]">
                    Waiting for Before (T1) image
                  </span>
                )}
                {afterFile ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] backdrop-blur-md">
                    <span>📷 After (T2): {afterFile.name.length > 20 ? afterFile.name.slice(0, 18) + "..." : afterFile.name}</span>
                    {onClearAfter && (
                      <button
                        type="button"
                        onClick={onClearAfter}
                        className="hover:text-white p-0.5 cursor-pointer"
                        title="Remove After image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-neutral-800/80 border border-neutral-700/50 text-neutral-400 text-[10px]">
                    Waiting for After (T2) image
                  </span>
                )}
              </>
            ) : (
              afterFile && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] backdrop-blur-md">
                  <span>📷 Attached: {afterFile.name.length > 25 ? afterFile.name.slice(0, 22) + "..." : afterFile.name}</span>
                  {onClearAfter && (
                    <button
                      type="button"
                      onClick={onClearAfter}
                      className="hover:text-white p-0.5 cursor-pointer"
                      title="Remove attached image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              )
            )}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="relative flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#130f2c]/90 backdrop-blur-2xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(168,85,247,0.15)] focus-within:border-cyan-400/60 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all"
        >
          {/* Hidden File Input triggered by '+' button */}
          <input
            ref={hiddenInputRef}
            type="file"
            accept="image/*,.tif,.tiff"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onAttachFile(e.target.files[0]);
              }
            }}
          />

          {/* '+' Button to attach imagery */}
          <button
            type="button"
            onClick={() => hiddenInputRef.current?.click()}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/5"
            title={
              mode === "comparison"
                ? !beforeFile
                  ? "Attach Before (T1) satellite imagery"
                  : "Attach After (T2) satellite imagery"
                : "Attach satellite imagery"
            }
          >
            <Plus className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Query Input */}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isSubmitting}
            placeholder={
              placeholder ||
              'Ask anything about this satellite image (e.g., "Count building footprints")...'
            }
            className="flex-1 bg-transparent py-2.5 px-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none disabled:opacity-50"
          />

          {/* Analyse Button */}
          <button
            type="submit"
            disabled={isSubmitting || !prompt.trim() || !hasImages}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#050510] font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.5)] disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyse</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Mandatory Government Disclaimer in Footer */}
        <p className="text-[10px] text-center text-neutral-500 mt-2">
          AI-generated preliminary analysis &bull; Official decisions require human verification.
        </p>
      </div>
    </div>
  );
}
