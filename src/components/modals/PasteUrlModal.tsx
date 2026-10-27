"use client";

import React, { useState } from "react";
import { X, Link2, ArrowRight } from "lucide-react";

interface PasteUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitUrl: (url: string) => void;
}

export function PasteUrlModal({
  isOpen,
  onClose,
  onSubmitUrl,
}: PasteUrlModalProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      new URL(url.trim());
      onSubmitUrl(url.trim());
      setUrl("");
      setError(null);
      onClose();
    } catch {
      setError("Please enter a valid HTTP/HTTPS image URL.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#140e32] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(0,242,254,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Paste Imagery URL</h3>
              <p className="text-[11px] text-neutral-400">
                Direct link to satellite raster (.tif, .png, .jpg)
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          <div className="space-y-1">
            <input
              type="url"
              required
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://example.com/satellite-capture.png"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-neutral-950 font-bold text-xs shadow-[0_0_15px_rgba(0,242,254,0.3)] disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Load Image</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
