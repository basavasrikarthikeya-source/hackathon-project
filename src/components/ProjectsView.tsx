"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Plus, MapPin } from "lucide-react";
import { Project } from "@/types/drishti";

interface ProjectsViewProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (project: Project) => void;
  onOpenNewProjectModal: () => void;
}

export function ProjectsView({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProjectModal,
}: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "chats">("recent");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter projects based on search query
  const filteredProjects = projects
    .filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "chats") return b.chatCount - a.chatCount;
      return 0; // Default recent order
    });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-7 relative z-10">
      {/* Header Section */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Projects
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Area workspaces for satellite intelligence and environmental monitoring
        </p>
      </div>

      {/* Action & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 bg-[#120d2b]/60 backdrop-blur-md border border-white/10 rounded-full text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all shadow-inner"
          />
        </div>

        {/* Sort & New Project Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown((prev) => !prev)}
              className="px-3.5 py-2 bg-[#120d2b]/60 backdrop-blur-md border border-white/10 rounded-full text-xs text-neutral-200 hover:text-white hover:border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="capitalize">{sortBy}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 mt-1.5 w-36 bg-[#160f36] border border-white/15 rounded-xl shadow-2xl py-1 z-30 text-xs">
                <button
                  onClick={() => {
                    setSortBy("recent");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left transition-colors cursor-pointer ${
                    sortBy === "recent"
                      ? "text-cyan-400 bg-white/5 font-semibold"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => {
                    setSortBy("name");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left transition-colors cursor-pointer ${
                    sortBy === "name"
                      ? "text-cyan-400 bg-white/5 font-semibold"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Alphabetical
                </button>
                <button
                  onClick={() => {
                    setSortBy("chats");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left transition-colors cursor-pointer ${
                    sortBy === "chats"
                      ? "text-cyan-400 bg-white/5 font-semibold"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Most Activity
                </button>
              </div>
            )}
          </div>

          {/* New Project Button */}
          <button
            onClick={onOpenNewProjectModal}
            className="py-2 px-4 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#050510] font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 border border-white/5 rounded-3xl bg-[#120d2b]/40 backdrop-blur-md">
          <p className="text-sm">No projects matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const isCurrent = project.id === activeProjectId;
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className={`group rounded-2xl overflow-hidden bg-[#150f33]/70 backdrop-blur-xl border transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(168,85,247,0.25)] ${
                  isCurrent
                    ? "border-cyan-400/50 shadow-[0_0_20px_rgba(0,242,254,0.2)]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                {/* Image Banner & Tags */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-neutral-900">
                  <img
                    src={project.bannerImage}
                    alt={project.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/mock/marked_sample.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#150f33] via-transparent to-transparent opacity-80" />

                  {/* Top Right Tag Chips */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0b071d]/80 backdrop-blur-md border border-white/15 text-neutral-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.extraTagCount && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#0b071d]/80 backdrop-blur-md border border-white/15 text-neutral-200">
                        +{project.extraTagCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Location Pin */}
                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {project.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                    <span>
                      {project.chatCount} CHATS &bull; {project.imageCount} IMAGES
                    </span>
                    <span>{project.lastActive}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
