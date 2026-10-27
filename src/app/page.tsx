"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase, Job } from "@/lib/supabase";
import type { Session, RealtimeChannel } from "@supabase/supabase-js";
import { engineOnline, triggerWorker } from "@/lib/engine";
import { CosmicBackground } from "@/components/CosmicBackground";
import { DrishtiHeader } from "@/components/DrishtiHeader";
import { DrishtiSidebar } from "@/components/DrishtiSidebar";
import { ProjectsView } from "@/components/ProjectsView";
import { InspectionHero } from "@/components/InspectionHero";
import { FloatingInputBar } from "@/components/FloatingInputBar";
import { InspectionResult } from "@/components/InspectionResult";
import { AuthModal } from "@/components/AuthModal";

// Modals
import { CommandPaletteModal } from "@/components/modals/CommandPaletteModal";
import { ProjectLibraryModal } from "@/components/modals/ProjectLibraryModal";
import { NewProjectModal } from "@/components/modals/NewProjectModal";
import { AboutModal } from "@/components/modals/AboutModal";
import { PasteUrlModal } from "@/components/modals/PasteUrlModal";

import { Project, Inspection } from "@/types/drishti";
// import { Loader2 } from "lucide-react";

// Default Projects (Photo 2)
const INITIAL_PROJECTS: Project[] = [
  {
    id: "p-amaravati",
    name: "Amaravati Flood Plain",
    location: "Krishna River Basin, AP",
    description:
      "Bi-temporal flood inundation analysis, unpermitted embankment detection, and catchment buffer assessment.",
    bannerImage: "/projects/amaravati.jpg",
    tags: ["Water", "Buildings"],
    extraTagCount: 1,
    chatCount: 5,
    imageCount: 6,
    lastActive: "1M AGO",
  },
  {
    id: "p-sundarbans",
    name: "Sundarbans Biosphere Reserve",
    location: "Ganges Delta Sector S-4",
    description:
      "Mangrove canopy density tracking, tidal surge salinity stress, and coastal fringe erosion audit.",
    bannerImage: "/projects/sundarbans.jpg",
    tags: ["Trees", "Water"],
    chatCount: 2,
    imageCount: 4,
    lastActive: "1D AGO",
  },
  {
    id: "p-bengaluru",
    name: "Bengaluru Tech Corridor Expansion",
    location: "Bellandur & Outer Ring Road",
    description:
      "High-density urban sprawl quantification, lake buffer compliance, and road network topological change.",
    bannerImage: "/projects/bengaluru.jpg",
    tags: ["Buildings", "Roads"],
    extraTagCount: 1,
    chatCount: 1,
    imageCount: 2,
    lastActive: "3D AGO",
  },
];

// Initial Inspection Items (Photo 2 & 3 Sidebar)
const INITIAL_INSPECTIONS: Inspection[] = [
  {
    id: "insp-pinned-1",
    projectId: "p-amaravati",
    title: "Monsoon Inundation Analysis (Breach AOI)",
    timeAgo: "2h",
    group: "PINNED",
    prompt:
      "Detect flood inundation breach zones, swollen river catchment buffer, and submerged structures.",
    mode: "comparison",
    imagePaths: ["/samples/amaravati_before.png", "/samples/amaravati_after.png"],
    status: "done",
    answer:
      "PRELIMINARY GEOSPATIAL FLAGGING: High-confidence bi-temporal flood breach detected along the northern embankment sector. Swollen river catchment has inundated ~14.2 hectares of low-lying agricultural buffer. 2 critical breaches localized with red bounding boxes.\n\n• Sector N-2: Embankment rupture [Box: 140, 170, 400, 430] (Confidence: 98%)\n• Sector E-4: Submerged infrastructure [Box: 440, 210, 630, 390] (Confidence: 94%)\n\nRecommended Action: Immediate deployment of emergency containment teams and drone telemetry dispatch.",
    markedImagePath: "/samples/amaravati_marked.png",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "insp-today-1",
    projectId: "p-amaravati",
    title: "Untitled Analysis",
    timeAgo: "now",
    group: "TODAY",
    prompt: "",
    mode: "interactive",
    imagePaths: [],
    status: "draft",
    createdAt: new Date().toISOString(),
  },
  {
    id: "insp-today-2",
    projectId: "p-amaravati",
    title: "Canal Siltation AOI Audit",
    timeAgo: "5m",
    group: "TODAY",
    prompt: "Audit drainage canal siltation and sedimentation buildup.",
    mode: "interactive",
    imagePaths: ["/projects/amaravati.jpg"],
    status: "done",
    answer:
      "PRELIMINARY GEOSPATIAL FLAGGING: Canal siltation and sediment blockage detected at intake junction. Canal throughput capacity reduced by ~35%. Ground desiltation recommended.",
    markedImagePath: "/mock/marked_sample.png",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "insp-today-3",
    projectId: "p-amaravati",
    title: "Untitled Analysis",
    timeAgo: "6m",
    group: "TODAY",
    prompt: "Scan area for unpermitted perimeter fencing or construction.",
    mode: "interactive",
    imagePaths: ["/projects/bengaluru.jpg"],
    status: "done",
    answer:
      "PRELIMINARY GEOSPATIAL FLAGGING: 2 perimeter clearings detected near water edge. Verification required.",
    markedImagePath: "/mock/marked_sample.png",
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: "insp-yest-1",
    projectId: "p-amaravati",
    title: "Encroachment & Embankment Audit",
    timeAgo: "1d",
    group: "YESTERDAY",
    prompt:
      "Evaluate unauthorized masonry work and structural encroachment inside coastal protection zone.",
    mode: "interactive",
    imagePaths: ["/mock/marked_sample.png"],
    status: "done",
    answer:
      "PRELIMINARY GEOSPATIAL FLAGGING: 3 unpermitted structures detected within the 100m designated river conservation buffer zone. Regulatory notice recommended.",
    markedImagePath: "/mock/marked_sample.png",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export default function SatQueryDrishtiApp() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<"projects" | "inspection">(
    "inspection"
  );
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [currentProject, setCurrentProject] = useState<Project>(INITIAL_PROJECTS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mode: "interactive" (single image) | "comparison" (Before T1 vs After T2)
  const [mode, setMode] = useState<"interactive" | "comparison">("interactive");

  // Inspections History State
  const [inspections, setInspections] = useState<Inspection[]>(INITIAL_INSPECTIONS);
  const [activeInspectionId, setActiveInspectionId] = useState<string>("insp-today-1");

  // Input & Upload State
  const [prompt, setPrompt] = useState("");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Engine & Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [isEngineOnline, setIsEngineOnline] = useState(true);

  // Modals State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showProjectLibrary, setShowProjectLibrary] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPasteUrlModal, setShowPasteUrlModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Active channels ref for Realtime
  const activeChannels = useRef<Record<string, RealtimeChannel>>({});
  const watchdogTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // 1. Initial Auth & Engine Health Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    engineOnline().then((online) => setIsEngineOnline(online));

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Keyboard shortcut for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Active Inspection Item
  const activeInspection =
    inspections.find((i) => i.id === activeInspectionId) || null;

  // 3. Realtime Supabase Subscription & 90s Watchdog Handlers
  const subscribeToJob = useCallback((jobId: string) => {
    if (activeChannels.current[jobId]) return;

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        ({ new: updatedRow }) => {
          const updatedJob = updatedRow as Job;

          // Update corresponding inspection in state
          setInspections((prev) =>
            prev.map((item) =>
              item.id === jobId
                ? {
                    ...item,
                    status: updatedJob.status,
                    answer: updatedJob.answer || item.answer,
                    markedImagePath:
                      updatedJob.marked_image_path || item.markedImagePath,
                  }
                : item
            )
          );

          if (updatedJob.status !== "processing" && watchdogTimers.current[jobId]) {
            clearTimeout(watchdogTimers.current[jobId]);
            delete watchdogTimers.current[jobId];
          }
        }
      )
      .subscribe();

    activeChannels.current[jobId] = channel;
  }, []);

  const armWatchdog = useCallback((jobId: string) => {
    if (watchdogTimers.current[jobId]) clearTimeout(watchdogTimers.current[jobId]);

    watchdogTimers.current[jobId] = setTimeout(async () => {
      try {
        const { data: j } = await supabase
          .from("jobs")
          .select("status")
          .eq("id", jobId)
          .single();

        if (j && j.status === "processing") {
          await supabase
            .from("jobs")
            .update({
              status: "error",
              answer:
                "The AI engine did not respond within 90 seconds. It may be busy or offline - please retry.",
            })
            .eq("id", jobId);

          setInspections((prev) =>
            prev.map((item) =>
              item.id === jobId
                ? {
                    ...item,
                    status: "error",
                    answer:
                      "The AI engine did not respond within 90 seconds. It may be busy or offline - please retry.",
                  }
                : item
            )
          );
        }
      } catch (e) {
        console.warn("Watchdog error:", e);
      }
      delete watchdogTimers.current[jobId];
    }, 90_000);
  }, []);

  // 4. Start New Inspection
  const handleNewInspection = () => {
    const newId = `insp-${Date.now()}`;
    const newInspection: Inspection = {
      id: newId,
      projectId: currentProject.id,
      title: "Untitled Analysis",
      timeAgo: "now",
      group: "TODAY",
      prompt: "",
      mode,
      imagePaths: [],
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    setInspections((prev) => [newInspection, ...prev]);
    setActiveInspectionId(newId);
    setPrompt("");
    setBeforeFile(null);
    setAfterFile(null);
    setCurrentView("inspection");
  };

  // 5. Select Existing Inspection from Sidebar
  const handleSelectInspection = (inspection: Inspection) => {
    setActiveInspectionId(inspection.id);
    setMode(inspection.mode);
    setPrompt(inspection.prompt);
    setCurrentView("inspection");
  };

  // 6. Select Project (Photo 2 -> Photo 3)
  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setCurrentView("inspection");
  };

  // 7. Submit Analysis Query Handler (Section 7.4 of Architecture Lock)
  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // [C-3] Auth gate: jobs table requires non-null user_id (NOT NULL FK to auth.users)
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    if (mode === "comparison" && (!beforeFile || !afterFile)) {
      alert("Comparison mode requires both a Before (T1) and After (T2) satellite image.");
      return;
    }

    if (mode === "interactive" && !afterFile && !beforeFile) {
      alert("Please attach a satellite image to analyse.");
      return;
    }

    setIsSubmitting(true);

    try {
      const jobId = crypto.randomUUID();
      const filesToUpload: File[] = [];

      if (mode === "comparison" && beforeFile && afterFile) {
        // STRICT CONTRACT: [before, after]
        filesToUpload.push(beforeFile, afterFile);
      } else if (afterFile) {
        filesToUpload.push(afterFile);
      } else if (beforeFile) {
        filesToUpload.push(beforeFile);
      }

      // Step (1): Upload originals to Supabase Storage bucket 'images' under orig/<uuid>
      const paths: string[] = [];
      for (const f of filesToUpload) {
        const uploadPath = `orig/${crypto.randomUUID()}-${f.name.replace(/\s+/g, "_")}`;
        try {
          const { data, error } = await supabase.storage
            .from("images")
            .upload(uploadPath, f);
          if (!error && data) {
            paths.push(data.path);
          } else {
            // Local blob fallback preview
            paths.push(URL.createObjectURL(f));
          }
        } catch {
          paths.push(URL.createObjectURL(f));
        }
      }

      // Step (2): Create or Update inspection entry in UI
      const inspectionTitle =
        prompt.length > 28 ? prompt.slice(0, 28) + "..." : prompt;

      const runningInspection: Inspection = {
        id: jobId,
        projectId: currentProject.id,
        title: inspectionTitle,
        timeAgo: "now",
        group: "TODAY",
        prompt: prompt.trim(),
        mode,
        imagePaths: paths,
        status: "processing",
        createdAt: new Date().toISOString(),
      };

      setInspections((prev) => [
        runningInspection,
        ...prev.filter((i) => i.id !== activeInspectionId || i.status !== "draft"),
      ]);
      setActiveInspectionId(jobId);

      // Step (3): Insert row in Supabase jobs table
      try {
        await supabase.from("jobs").insert({
          id: jobId,
          user_id: session?.user?.id || null,
          prompt: prompt.trim(),
          image_paths: paths,
          status: "processing",
        });
      } catch (err) {
        console.warn("Supabase insert notice:", err);
      }

      // Step (4): SUBSCRIBE FIRST, THEN TRIGGER WORKER (LOCKED CONTRACT)
      subscribeToJob(jobId);

      void triggerWorker(jobId, prompt.trim(), paths).catch(async (err) => {
        console.error("Worker trigger failed:", err);
        setInspections((prev) =>
          prev.map((i) =>
            i.id === jobId
              ? {
                  ...i,
                  status: "error",
                  answer: "Could not reach the AI engine worker. Please retry.",
                }
              : i
          )
        );
      });

      // Step (5): Arm 90-second watchdog
      armWatchdog(jobId);

      // Reset form fields
      setPrompt("");
      setBeforeFile(null);
      setAfterFile(null);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper when user selects a preset dataset from ProjectLibraryModal
  const handleSelectDataset = (d: {
    id?: string;
    projectName: string;
    beforeUrl?: string;
    afterUrl: string;
    prompt: string;
    isComparison: boolean;
  }) => {
    // Match project
    const proj = projects.find((p) => p.name === d.projectName) || currentProject;
    setCurrentProject(proj);
    setMode(d.isComparison ? "comparison" : "interactive");
    setPrompt(d.prompt);

    // Create File objects from URLs
    fetch(d.afterUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `${d.id}-after.png`, {
          type: "image/png",
        });
        setAfterFile(file);
      })
      .catch(() => {
        // Fallback
      });

    if (d.beforeUrl) {
      fetch(d.beforeUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `${d.id}-before.png`, {
            type: "image/png",
          });
          setBeforeFile(file);
        })
        .catch(() => {});
    }

    setCurrentView("inspection");
  };

  const hasAttachedImages =
    mode === "comparison"
      ? Boolean(beforeFile && afterFile)
      : Boolean(afterFile || beforeFile);

  return (
    <div className="min-h-screen bg-[#070312] text-neutral-100 flex font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* 1. Stunning Cosmic Space Galaxy Background */}
      <CosmicBackground />

      {/* 2. Left Sidebar (Photos 2 & 3) */}
      <DrishtiSidebar
        currentProject={currentProject}
        inspections={inspections}
        activeInspectionId={activeInspectionId}
        onSelectInspection={handleSelectInspection}
        onNewInspection={handleNewInspection}
        onOpenProjectLibrary={() => setCurrentView("projects")}
        onOpenCommands={() => setShowCommandPalette(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        userEmail={session?.user?.email || null}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        {/* Top Header Navigation (Photos 2 & 3) */}
        <DrishtiHeader
          currentProject={currentProject}
          activeInspection={activeInspection}
          currentView={currentView}
          mode={mode}
          onSelectMode={(selectedMode) => {
            setMode(selectedMode);
            if (currentView === "projects") {
              setCurrentView("inspection");
            }
          }}
          onOpenAbout={() => setShowAboutModal(true)}
          onNavigateProjects={() => setCurrentView("projects")}
          isEngineOnline={isEngineOnline}
        />

        {/* View Switcher: Projects View (Photo 2) vs Inspection View (Photo 3 / Result) */}
        {currentView === "projects" ? (
          /* PHOTO 2: Projects Grid View */
          <ProjectsView
            projects={projects}
            activeProjectId={currentProject.id}
            onSelectProject={handleSelectProject}
            onOpenNewProjectModal={() => setShowNewProjectModal(true)}
          />
        ) : (
          /* PHOTO 3: Inspection Hero or Live Results View */
          <div className="flex-1 flex flex-col justify-between">
            {activeInspection &&
            (activeInspection.status === "done" ||
              activeInspection.status === "processing" ||
              activeInspection.status === "error") ? (
              /* Inspection Live Processing & Results */
              <InspectionResult
                inspection={activeInspection}
                onRetry={() => {
                  if (activeInspection) {
                    setPrompt(activeInspection.prompt);
                    setMode(activeInspection.mode);
                    handleNewInspection();
                  }
                }}
                onNewInspection={handleNewInspection}
              />
            ) : (
              /* PHOTO 3: Hero State "What would you like to see?" */
              <InspectionHero
                mode={mode}
                beforeFile={beforeFile}
                setBeforeFile={setBeforeFile}
                afterFile={afterFile}
                setAfterFile={setAfterFile}
                onSelectSuggestedAction={(actionPrompt) => {
                  setPrompt(actionPrompt);
                }}
                onOpenProjectLibrary={() => setShowProjectLibrary(true)}
                onOpenPasteUrl={() => setShowPasteUrlModal(true)}
              />
            )}

            {/* Bottom Floating Input Bar (Photo 3) */}
            <FloatingInputBar
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={handleSubmitQuery}
              isSubmitting={isSubmitting}
              hasImages={hasAttachedImages}
              onAttachFile={(file) => {
                if (mode === "comparison" && !beforeFile) {
                  setBeforeFile(file);
                } else {
                  setAfterFile(file);
                }
              }}
              placeholder={
                mode === "comparison"
                  ? "Ask what changed between Before (T1) and After (T2) captures..."
                  : 'Ask anything about this satellite image (e.g., "Count building footprints")...'
              }
            />
          </div>
        )}
      </div>

      {/* 4. Interactive Modals & Dialogs */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNewInspection={handleNewInspection}
        onSelectProject={(name) => {
          const p = projects.find((x) => x.name === name);
          if (p) handleSelectProject(p);
        }}
        onSelectPresetQuery={(q) => {
          setPrompt(q);
          setCurrentView("inspection");
        }}
        onToggleMode={(m) => setMode(m)}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenProjectLibrary={() => setShowProjectLibrary(true)}
      />

      <ProjectLibraryModal
        isOpen={showProjectLibrary}
        onClose={() => setShowProjectLibrary(false)}
        onSelectDataset={handleSelectDataset}
      />

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreateProject={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setCurrentProject(newProj);
          setCurrentView("inspection");
        }}
      />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        isEngineOnline={isEngineOnline}
      />

      <PasteUrlModal
        isOpen={showPasteUrlModal}
        onClose={() => setShowPasteUrlModal(false)}
        onSubmitUrl={async (url) => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const file = new File([blob], "pasted-satellite.png", {
              type: blob.type || "image/png",
            });
            setAfterFile(file);
          } catch {
            alert("Could not fetch image from provided URL due to CORS. Please upload file directly.");
          }
        }}
      />

      {/* Supabase Auth Gate / Modal */}
      {showAuthModal && (
        <AuthModal
          onSuccess={() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
              setSession(session);
              setShowAuthModal(false);
            });
          }}
        />
      )}
    </div>
  );
}
