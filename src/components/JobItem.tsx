"use client";

import React, { useState } from "react";
import { Job, supabase } from "@/lib/supabase";
import {
  Loader2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ZoomIn,
  Eye,
  ShieldAlert,
} from "lucide-react";

interface JobItemProps {
  job: Job;
  onRetry: (job: Job) => void;
}

export function JobItem({ job, onRetry }: JobItemProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // Derive public URLs for images
  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
  };

  const markedImageUrl = job.marked_image_path ? getImageUrl(job.marked_image_path) : null;
  const isComparison = job.image_paths && job.image_paths.length === 2;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-lg transition-all space-y-0">
      {/* 1. Officer Question & Attachments */}
      <div className="p-4 sm:p-5 border-b border-neutral-800/80 bg-neutral-900/40">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 uppercase tracking-wider">
                Officer Query
              </span>
              <span className="text-[11px] text-neutral-500">
                {new Date(job.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm sm:text-base font-medium text-neutral-100">
              {job.prompt}
            </p>
          </div>

          {/* Attached image thumbnails */}
          {job.image_paths && job.image_paths.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {job.image_paths.map((p, idx) => {
                const url = getImageUrl(p);
                const isAfter = isComparison && idx === 1;
                return (
                  <div key={p} className="relative group">
                    <img
                      src={url || "/mock/marked_sample.png"}
                      alt={`Attached satellite ${idx + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/mock/marked_sample.png";
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-neutral-700 group-hover:border-emerald-500/50 transition-colors"
                    />
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-neutral-950/90 border border-neutral-700 text-[9px] font-bold rounded text-neutral-300">
                      {isComparison ? (isAfter ? "T2" : "T1") : "IMG"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. AI Response Section */}
      <div className="p-4 sm:p-5">
        {/* Processing State */}
        {job.status === "processing" && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Loader2 className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-neutral-200">
                Analyzing Satellite Imagery...
              </h4>
              <p className="text-xs text-neutral-400 max-w-sm">
                Running vision-language inference and bounding box localization on the GPU worker. This can take up to ~2 minutes.
              </p>
            </div>
            <div className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden mt-2">
              <div className="w-1/2 h-full bg-emerald-500/70 rounded-full animate-[pulse_1.5s_infinite]" />
            </div>
          </div>
        )}

        {/* Error State */}
        {job.status === "error" && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Analysis Pipeline Error
                </h4>
                <p className="text-xs text-red-200/90 leading-relaxed">
                  {job.answer ||
                    "Could not complete model inference. The Kaggle worker session may be offline or restarting."}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => onRetry(job)}
                className="px-3.5 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-white border border-red-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Analysis</span>
              </button>
            </div>
          </div>
        )}

        {/* Done State */}
        {job.status === "done" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Text Analysis */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Model Intelligence Assessment
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {job.answer}
                </div>

                {/* Trust disclaimer (Section 1 requirement) */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800/80 text-[11px] text-neutral-400">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-neutral-300">Model flags, humans decide:</strong> AI-generated preliminary analysis - official decisions require human verification.
                  </span>
                </div>
              </div>

              {/* Right Column: Marked Image */}
              <div className="lg:col-span-5 space-y-2">
                {markedImageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                    <img
                      src={imageFailed ? "/mock/marked_sample.png" : markedImageUrl}
                      alt="AI Marked Satellite Result"
                      onError={() => {
                        // Fallback once to mock sample if storage upload hasn't arrived
                        setImageFailed(true);
                      }}
                      className="w-full h-auto object-cover max-h-[380px] rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    {/* Overlay action */}
                    <button
                      type="button"
                      onClick={() => setShowFullImage(true)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-xs cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Inspect Full Resolution</span>
                    </button>

                    {/* Caption for 2-image comparison (Section 7.5 requirement) */}
                    {isComparison && (
                      <div className="p-2 bg-neutral-950/90 border-t border-neutral-800/80 text-[11px] font-medium text-emerald-300 text-center">
                        Marks shown on the AFTER (T2) image
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-950 text-center text-xs text-neutral-500">
                    No visual bounding boxes localized for this query.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Zoom Modal */}
      {showFullImage && markedImageUrl && (
        <div
          onClick={() => setShowFullImage(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-auto rounded-xl border border-neutral-800 bg-neutral-950">
            <img
              src={imageFailed ? "/mock/marked_sample.png" : markedImageUrl}
              alt="Full Resolution AI Analysis"
              className="w-full h-auto rounded-lg"
            />
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 text-center text-xs text-neutral-300">
              Click anywhere to close full-resolution view
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
