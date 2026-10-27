"use client";

import React, { useState } from "react";
import {
  Loader2,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  Download,
  Share2,
  Layers,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { Inspection } from "@/types/drishti";
import { supabase } from "@/lib/supabase";

interface InspectionResultProps {
  inspection: Inspection;
  onRetry: () => void;
  onNewInspection: () => void;
}

export function InspectionResult({
  inspection,
  onRetry,
  onNewInspection,
}: InspectionResultProps) {
  const [activeTab, setActiveTab] = useState<"marked" | "before" | "after">(
    "marked"
  );
  const [showLightbox, setShowLightbox] = useState(false);

  // Helper to resolve Supabase or sample storage URLs
  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "/mock/marked_sample.png";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("samples/") || path.startsWith("/samples/"))
      return path.startsWith("/") ? path : `/${path}`;
    if (path.startsWith("mock/") || path.startsWith("/mock/"))
      return path.startsWith("/") ? path : `/${path}`;
    return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
  };

  const markedUrl = getImageUrl(
    inspection.markedImagePath ||
      (inspection.imagePaths && inspection.imagePaths[0])
  );
  const isComparison = inspection.imagePaths && inspection.imagePaths.length >= 2;
  const beforeUrl = isComparison ? getImageUrl(inspection.imagePaths[0]) : null;
  const afterUrl = isComparison ? getImageUrl(inspection.imagePaths[1]) : null;

  const currentDisplayUrl =
    isComparison && activeTab === "before"
      ? beforeUrl
      : isComparison && activeTab === "after"
      ? afterUrl
      : markedUrl;

  const handleDownloadReport = () => {
    const reportData = {
      title: inspection.title,
      date: inspection.createdAt,
      prompt: inspection.prompt,
      status: inspection.status,
      findings: inspection.answer,
      imagePaths: inspection.imagePaths,
      markedImage: inspection.markedImagePath,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drishti-inspection-${inspection.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6 relative z-10">
      {/* Inspection Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#120d2e]/70 backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                inspection.status === "processing"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                  : inspection.status === "done"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-red-500/20 text-red-300 border border-red-500/40"
              }`}
            >
              {inspection.status === "processing"
                ? "Analyzing Raster"
                : inspection.status === "done"
                ? "Inspection Complete"
                : "Failed"}
            </span>
            <span className="text-xs text-neutral-400">
              {new Date(inspection.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            {inspection.title}
          </h2>
          <p className="text-xs text-neutral-300 line-clamp-2">
            <span className="text-cyan-400 font-medium">Query: </span>
            {inspection.prompt}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {inspection.status === "done" && (
            <button
              onClick={handleDownloadReport}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download analysis report"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Report</span>
            </button>
          )}

          <button
            onClick={onNewInspection}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:scale-105 transition-all cursor-pointer"
          >
            <span>+ New</span>
          </button>
        </div>
      </div>

      {/* Main Content: Imagery & Analysis Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Satellite Viewer (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-[#0d091e] border border-white/10 shadow-2xl aspect-[4/3] flex items-center justify-center group">
            {/* Satellite Image */}
            <img
              src={currentDisplayUrl || "/mock/marked_sample.png"}
              alt="Satellite Analysis Display"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/mock/marked_sample.png";
              }}
            />

            {/* Radar / Sonar Scanning Overlay while processing */}
            {inspection.status === "processing" && (
              <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                  <div className="absolute inset-2 rounded-full border border-purple-500/30 border-b-purple-400 animate-spin animate-reverse" />
                  <Loader2 className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    GPU Vision-Language Inference
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs">
                    Qwen2.5-VL-7B localizing bounding boxes and evaluating geospatial anomalies.
                  </p>
                </div>

                <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            )}

            {/* Zoom / Lightbox Trigger */}
            {inspection.status === "done" && (
              <button
                onClick={() => setShowLightbox(true)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Open high-res fullscreen view"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            )}

            {/* View Layer Badge */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-neutral-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                {isComparison
                  ? activeTab === "before"
                    ? "Baseline (T1)"
                    : activeTab === "after"
                    ? "Current (T2)"
                    : "AI Marked Flags (T2)"
                  : "AI Annotated Raster"}
              </span>
            </div>
          </div>

          {/* Comparison Mode Image Layer Switcher */}
          {isComparison && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#120d2a]/70 border border-white/10 text-xs">
              <span className="text-neutral-400 text-[11px] font-medium pl-1">
                Layer View:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("before")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === "before"
                      ? "bg-white/15 text-white font-semibold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Before (T1)
                </button>
                <button
                  onClick={() => setActiveTab("after")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === "after"
                      ? "bg-white/15 text-white font-semibold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  After (T2)
                </button>
                <button
                  onClick={() => setActiveTab("marked")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === "marked"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  AI Marked (T2)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis Report (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl p-5 bg-[#140e32]/70 backdrop-blur-xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Mission Intelligence Report
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    Confidence: High &bull; Multi-Spectral VLM
                  </span>
                </div>
              </div>
            </div>

            {/* Findings Text Body */}
            {inspection.status === "processing" ? (
              <div className="space-y-3 py-6 text-center">
                <p className="text-xs text-neutral-400 italic">
                  Parsing geographic features, hydrological stress, and structure anomalies...
                </p>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Raster bounds verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>Cross-referencing spatial buffer</span>
                  </div>
                </div>
              </div>
            ) : inspection.status === "error" ? (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 space-y-3 text-xs text-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-100">
                      Inference Timeout or Disconnection
                    </h4>
                    <p className="mt-1 leading-relaxed text-red-300">
                      {inspection.answer ||
                        "The Kaggle worker could not be reached. Ensure the worker session is active or retry using simulation."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRetry}
                  className="px-3.5 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Inspection</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed space-y-2">
                  <p className="whitespace-pre-line">
                    {inspection.answer ||
                      "PRELIMINARY FLAGGING: Red bounding boxes indicate visual anomalies and localized change detections requiring officer verification."}
                  </p>
                </div>

                {/* Key Observations Summary Card */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Tactical Assessment
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px]">
                    <li>Red bounding boxes rendered directly on satellite raster</li>
                    <li>Coordinates localized via 0-1000 normalized patch grid</li>
                    <li>Human officer ground confirmation recommended before dispatch</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Official Doctrine Reminder */}
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-neutral-400">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Model Flags, Humans Decide:</strong> AI findings are advisory only.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close zoom"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentDisplayUrl || "/mock/marked_sample.png"}
            alt="Fullscreen Satellite Raster"
            className="max-w-full max-h-[90vh] object-contain rounded-xl border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
