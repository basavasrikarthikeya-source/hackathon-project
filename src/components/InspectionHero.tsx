"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Droplets,
  Trees,
  X,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";

interface InspectionHeroProps {
  mode: "interactive" | "comparison";
  beforeFile: File | null;
  setBeforeFile: (f: File | null) => void;
  afterFile: File | null;
  setAfterFile: (f: File | null) => void;
  onSelectSuggestedAction: (actionPrompt: string) => void;
  onOpenProjectLibrary: () => void;
  onOpenPasteUrl: () => void;
}

export function InspectionHero({
  mode,
  beforeFile,
  setBeforeFile,
  afterFile,
  setAfterFile,
  onSelectSuggestedAction,
  onOpenProjectLibrary,
  onOpenPasteUrl,
}: InspectionHeroProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (mode === "comparison") {
        if (e.dataTransfer.files.length >= 2) {
          setBeforeFile(e.dataTransfer.files[0]);
          setAfterFile(e.dataTransfer.files[1]);
        } else {
          if (!beforeFile) setBeforeFile(e.dataTransfer.files[0]);
          else setAfterFile(e.dataTransfer.files[0]);
        }
      } else {
        setAfterFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: "after" | "before" = "after"
  ) => {
    if (e.target.files && e.target.files[0]) {
      if (slot === "before") {
        setBeforeFile(e.target.files[0]);
      } else {
        setAfterFile(e.target.files[0]);
      }
    }
  };

  const swapImages = () => {
    const temp = beforeFile;
    setBeforeFile(afterFile);
    setAfterFile(temp);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6 sm:space-y-8 relative z-10 select-none">
      {/* Title & Subtitle */}
      <div className="text-center space-y-2 max-w-xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
          What would you like to see?
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Drop satellite imagery below or select a sample question to start.
        </p>
      </div>

      {/* Main Drag & Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`w-full max-w-2xl rounded-3xl p-6 sm:p-9 bg-[#110c28]/60 backdrop-blur-xl border transition-all duration-300 shadow-2xl flex flex-col items-center justify-center text-center ${
          isDragOver
            ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(0,242,254,0.3)] scale-[1.01]"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.tif,.tiff"
          className="hidden"
          onChange={(e) => handleFileChange(e, "after")}
        />
        <input
          ref={beforeInputRef}
          type="file"
          accept="image/*,.tif,.tiff"
          className="hidden"
          onChange={(e) => handleFileChange(e, "before")}
        />

        {/* Uploaded File Previews */}
        {mode === "comparison" ? (
          /* Dual Slots for Comparison Mode */
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Baseline (Before / T1) */}
              <div className="p-3.5 rounded-2xl bg-[#161033]/80 border border-white/10 flex flex-col items-center text-center relative group">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-2">
                  Baseline Capture (Before T1)
                </span>
                {beforeFile ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                    <img
                      src={URL.createObjectURL(beforeFile)}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setBeforeFile(null)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-500 rounded-full text-white transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1.5 right-1.5 text-[10px] text-white/90 truncate bg-black/60 px-1.5 py-0.5 rounded">
                      {beforeFile.name}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => beforeInputRef.current?.click()}
                    className="w-full h-28 rounded-xl border border-dashed border-white/20 hover:border-cyan-400/50 flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer bg-white/[0.02]"
                  >
                    <Upload className="w-5 h-5 text-neutral-500" />
                    <span className="text-xs">Select Before Image</span>
                  </button>
                )}
              </div>

              {/* Current (After / T2) */}
              <div className="p-3.5 rounded-2xl bg-[#161033]/80 border border-white/10 flex flex-col items-center text-center relative group">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 mb-2">
                  Current Capture (After T2 - Marked)
                </span>
                {afterFile ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                    <img
                      src={URL.createObjectURL(afterFile)}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setAfterFile(null)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-500 rounded-full text-white transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1.5 right-1.5 text-[10px] text-white/90 truncate bg-black/60 px-1.5 py-0.5 rounded">
                      {afterFile.name}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 rounded-xl border border-dashed border-white/20 hover:border-cyan-400/50 flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer bg-white/[0.02]"
                  >
                    <Upload className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs">Select After Image</span>
                  </button>
                )}
              </div>
            </div>

            {beforeFile && afterFile && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={swapImages}
                  className="px-3 py-1 rounded-full text-[11px] text-neutral-300 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Swap Before &amp; After</span>
                </button>
                <span className="text-[11px] text-neutral-400">
                  &bull; AI flags will be localized on the AFTER image
                </span>
              </div>
            )}
          </div>
        ) : afterFile ? (
          /* Single Image Uploaded Preview */
          <div className="w-full flex flex-col items-center space-y-3">
            <div className="relative w-64 h-36 rounded-2xl overflow-hidden bg-neutral-900 border border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,254,0.2)]">
              <img
                src={URL.createObjectURL(afterFile)}
                alt="Selected Satellite Imagery"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setAfterFile(null)}
                className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-red-500 rounded-full text-white transition-colors cursor-pointer"
                title="Remove satellite image"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/75 rounded text-left flex items-center justify-between text-[11px] text-white">
                <span className="truncate max-w-[160px]">{afterFile.name}</span>
                <span className="text-neutral-400 text-[10px]">
                  {(afterFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Satellite raster attached and ready for analysis</span>
            </div>
          </div>
        ) : (
          /* Default Empty Dropzone View (Matching Photo 3) */
          <>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 mb-3.5 group-hover:scale-105 transition-transform shadow-inner">
              <Upload className="w-6 h-6 stroke-[1.75] text-neutral-200" />
            </div>

            <p className="text-sm sm:text-base font-semibold text-white">
              Drop satellite raster or orthomosaic here
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Supports GeoTIFF (.tif), PNG, JPG up to 50 MB
            </p>

            {/* Three Action Links Below */}
            <div className="flex items-center gap-4 sm:gap-6 mt-4 text-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-neutral-300 hover:text-white transition-colors cursor-pointer underline underline-offset-4 decoration-white/20 hover:decoration-white"
              >
                Browse device
              </button>
              <button
                onClick={onOpenProjectLibrary}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer underline underline-offset-4 decoration-cyan-400/40 hover:decoration-cyan-300"
              >
                Project library
              </button>
              <button
                onClick={onOpenPasteUrl}
                className="text-neutral-300 hover:text-white transition-colors cursor-pointer underline underline-offset-4 decoration-white/20 hover:decoration-white"
              >
                Paste URL
              </button>
            </div>
          </>
        )}
      </div>

      {/* Suggested Actions (Below the Dropzone Box) */}
      <div className="w-full flex flex-col items-center space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Suggested Actions
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() =>
              onSelectSuggestedAction(
                "Count and identify all building footprints and detect unauthorized construction."
              )
            }
            className="px-3.5 py-1.5 rounded-full bg-[#140e30]/80 hover:bg-[#1a123f] border border-white/10 hover:border-cyan-400/40 text-neutral-200 hover:text-white text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Count buildings</span>
          </button>

          <button
            onClick={() =>
              onSelectSuggestedAction(
                "Detect water bodies, flood inundation extent, and shoreline breach zones."
              )
            }
            className="px-3.5 py-1.5 rounded-full bg-[#140e30]/80 hover:bg-[#1a123f] border border-white/10 hover:border-cyan-400/40 text-neutral-200 hover:text-white text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Detect water bodies</span>
          </button>

          <button
            onClick={() =>
              onSelectSuggestedAction(
                "Measure tree canopy coverage, foliage density tracking, and vegetation loss."
              )
            }
            className="px-3.5 py-1.5 rounded-full bg-[#140e30]/80 hover:bg-[#1a123f] border border-white/10 hover:border-cyan-400/40 text-neutral-200 hover:text-white text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <Trees className="w-3.5 h-3.5 text-cyan-400" />
            <span>Measure canopy coverage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
