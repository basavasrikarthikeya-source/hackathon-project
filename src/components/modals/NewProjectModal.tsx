"use client";

import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { Project } from "@/types/drishti";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreateProject,
}: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Water", "Forest"]);

  if (!isOpen) return null;

  const availableTags = [
    "Water",
    "Buildings",
    "Forest",
    "Roads",
    "Flood",
    "Glacier",
    "Agriculture",
    "Mining",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    const newProj: Project = {
      id: crypto.randomUUID(),
      name: name.trim(),
      location: location.trim(),
      description:
        description.trim() ||
        "Geospatial monitoring workspace for aerial intelligence and anomaly detection.",
      bannerImage: "/projects/amaravati.jpg",
      tags: selectedTags.slice(0, 2),
      extraTagCount: selectedTags.length > 2 ? selectedTags.length - 2 : undefined,
      chatCount: 0,
      imageCount: 0,
      lastActive: "JUST NOW",
    };

    onCreateProject(newProj);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#140e32] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(0,242,254,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">New Workspace</h3>
              <p className="text-xs text-neutral-400">
                Create a dedicated AOI monitoring workspace
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Workspace / Area Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yamuna Floodplain AOI"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Geographic Location / Coordinates *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Okhla Barrage Sector, Delhi"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Mission Scope &amp; Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monitoring seasonal water levels, vegetation cover, and unauthorized structures."
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Focus Categories
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                        : "bg-white/5 text-neutral-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !location.trim()}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-neutral-950 font-bold text-xs shadow-[0_0_15px_rgba(0,242,254,0.3)] disabled:opacity-40 transition-all cursor-pointer"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
