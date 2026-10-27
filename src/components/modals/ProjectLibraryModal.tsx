"use client";

import React from "react";
import { X, Layers, Check, ArrowRight, MapPin } from "lucide-react";

interface ProjectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (dataset: {
    id?: string;
    projectName: string;
    beforeUrl?: string;
    afterUrl: string;
    prompt: string;
    isComparison: boolean;
  }) => void;
}

export function ProjectLibraryModal({
  isOpen,
  onClose,
  onSelectDataset,
}: ProjectLibraryModalProps) {
  if (!isOpen) return null;

  const datasets = [
    {
      id: "amaravati-flood",
      projectName: "Amaravati Flood Plain",
      location: "Krishna River Basin, AP",
      title: "Bi-Temporal Monsoon Flood Breach (T1 vs T2)",
      description:
        "Dual satellite captures of Krishna river catchment before and after high-intensity monsoon inflow. Ideal for testing bi-temporal comparison mode.",
      beforeUrl: "/samples/amaravati_before.png",
      afterUrl: "/samples/amaravati_after.png",
      thumbnail: "/samples/amaravati_after.png",
      prompt:
        "What changed between the baseline and post-monsoon captures? Identify flooded farmland and embankment breaches.",
      isComparison: true,
      tags: ["Water", "Flood", "Comparison"],
    },
    {
      id: "sundarbans-canopy",
      projectName: "Sundarbans Biosphere Reserve",
      location: "Ganges Delta Sector S-4",
      title: "Mangrove Fringe Density & Salinity Stress",
      description:
        "High-resolution multi-spectral capture tracking mangrove foliage health, tidal surge siltation, and coastal buffer degradation.",
      afterUrl: "/projects/sundarbans.jpg",
      thumbnail: "/projects/sundarbans.jpg",
      prompt:
        "Measure canopy coverage, foliage density tracking, and coastal erosion along tidal inlets.",
      isComparison: false,
      tags: ["Trees", "Canopy", "Conservation"],
    },
    {
      id: "bengaluru-corridor",
      projectName: "Bengaluru Tech Corridor Expansion",
      location: "Bellandur & Outer Ring Road",
      title: "Urban Sprawl & Lake Buffer Encroachment",
      description:
        "Orthomosaic capture of tech park development, arterial transit corridors, and lake preservation buffer zones.",
      afterUrl: "/projects/bengaluru.jpg",
      thumbnail: "/projects/bengaluru.jpg",
      prompt:
        "Count and identify all building footprints and detect unauthorized construction inside the water buffer.",
      isComparison: false,
      tags: ["Buildings", "Roads", "Urban"],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#140e32] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(0,242,254,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Satellite Project Library
              </h3>
              <p className="text-xs text-neutral-400">
                Pre-calibrated satellite captures ready for instant AI evaluation
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

        {/* Datasets List */}
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {datasets.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl bg-[#1a123f]/60 hover:bg-[#1f164b] border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between group"
            >
              {/* Thumbnail */}
              <div className="relative w-full sm:w-28 h-20 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
                <img
                  src={d.thumbnail}
                  alt={d.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {d.isComparison && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/80 text-cyan-300">
                    Dual T1/T2
                  </span>
                )}
              </div>

              {/* Text Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {d.location}
                  </span>
                  <div className="flex items-center gap-1">
                    {d.tags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.2 rounded text-[9px] bg-white/10 text-neutral-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {d.title}
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                  {d.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  onSelectDataset(d);
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <span>Load Dataset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
