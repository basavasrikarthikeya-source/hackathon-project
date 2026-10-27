import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AppMode,
  Message,
  AttachedImage,
  DrishtiAnswer,
  VerdictType,
  PolygonOutline
} from '../types';
import { EvidenceImageViewer } from './EvidenceImageViewer';
import { ComparisonSlider } from './ComparisonSlider';
import { AuditTrail } from './AuditTrail';
import { ApiKeyModal } from './ApiKeyModal';
import { drishtiEngine } from '../services/api';
import {
  SAMPLE_IMAGES,
  DEMO_ANSWERS,
  SUGGESTED_CHIPS
} from '../constants/sampleData';
import {
  Send,
  Plus,
  Sparkles,
  Upload,
  Globe,
  Key,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Square,
  ShieldCheck,
  Building2,
  Droplets,
  Layers,
  CloudOff,
  ShieldAlert,
  ArrowRight,
  ImageIcon,
  Trash2
} from 'lucide-react';

interface ChatPageProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onNavigate: (route: '/' | '/chat') => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  mode,
  onModeChange,
  onNavigate
}) => {
  // =========================================================================
  // SEPARATE STATE PER MODE (switching modes never deletes anything)
  // =========================================================================

  // 1. Interactive Mode State
  const [interactiveImage, setInteractiveImage] = useState<AttachedImage | null>(null);
  const [interactivePrompt, setInteractivePrompt] = useState<string>('');
  const [interactiveMessages, setInteractiveMessages] = useState<Message[]>([]);
  const [interactiveLoading, setInteractiveLoading] = useState<boolean>(false);
  const [interactiveLoadingStep, setInteractiveLoadingStep] = useState<string>('');

  // 2. Comparison Mode State
  const [pastImage, setPastImage] = useState<AttachedImage | null>(null);
  const [newImage, setNewImage] = useState<AttachedImage | null>(null);
  const [comparisonPrompt, setComparisonPrompt] = useState<string>('');
  const [comparisonMessages, setComparisonMessages] = useState<Message[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const [comparisonLoadingStep, setComparisonLoadingStep] = useState<string>('');

  // Modal & Attach Popover State
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [apiKeyModalSlot, setApiKeyModalSlot] = useState<'interactive' | 'past' | 'new'>('interactive');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState<boolean>(false);
  const [showUrlDialog, setShowUrlDialog] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlSlotTarget, setUrlSlotTarget] = useState<'interactive' | 'past' | 'new'>('interactive');
  const [urlError, setUrlError] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Inline feedback warnings
  const [inlineWarning, setInlineWarning] = useState<string | null>(null);

  // Cancellation reference for in-flight requests
  const abortRef = useRef<boolean>(false);

  // File input refs
  const interactiveFileInputRef = useRef<HTMLInputElement>(null);
  const pastFileInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages or loading steps
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactiveMessages, comparisonMessages, interactiveLoading, comparisonLoading]);

  // Auto-resize textarea when text changes
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const currentPrompt = mode === 'interactive' ? interactivePrompt : comparisonPrompt;
  const setCurrentPrompt = (text: string) => {
    if (mode === 'interactive') {
      setInteractivePrompt(text);
    } else {
      setComparisonPrompt(text);
    }
    // Clear inline warning when user starts typing
    if (inlineWarning) setInlineWarning(null);
  };

  const isCurrentSubmitting = mode === 'interactive' ? interactiveLoading : comparisonLoading;
  const currentMessages = mode === 'interactive' ? interactiveMessages : comparisonMessages;

  // Comparison readiness
  const isComparisonReady = Boolean(pastImage && newImage);
  const comparisonMissingSlot = !pastImage && !newImage ? 'both' : !pastImage ? 'past' : !newImage ? 'new' : null;

  // =========================================================================
  // FILE / IMAGE HELPERS
  // =========================================================================
  const createAttachedImageFromFile = (file: File, type?: 'before' | 'after' | 'single'): AttachedImage => {
    const isTiff = file.name.endsWith('.tif') || file.name.endsWith('.tiff');
    return {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      format: isTiff ? 'GeoTIFF' : file.type.includes('png') ? 'PNG' : 'JPG',
      type,
      sensor: isTiff ? 'Raster Orthomosaic (GeoTIFF)' : 'High-Res Optical Capture',
      gsd: isTiff ? 'Calibrated 0.3m' : 'Standard Optical'
    };
  };

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetSlot?: 'interactive' | 'past' | 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const slot = targetSlot || (mode === 'interactive' ? 'interactive' : !pastImage ? 'past' : 'new');
    const newImg = createAttachedImageFromFile(file, slot === 'past' ? 'before' : slot === 'new' ? 'after' : 'single');

    if (slot === 'interactive') {
      setInteractiveImage(newImg);
    } else if (slot === 'past') {
      setPastImage(newImg);
    } else if (slot === 'new') {
      setNewImage(newImg);
    }

    setInlineWarning(null);
    setIsAttachMenuOpen(false);
    e.target.value = '';
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
      const filename = urlInput.split('/').pop()?.split('?')[0] || 'remote-raster-tile.jpg';
      const newImg: AttachedImage = {
        id: `url-${Date.now()}`,
        name: filename,
        url: urlInput,
        size: 'Remote Stream',
        format: 'Web URL',
        sensor: 'Remote Satellite Tile Stream'
      };

      if (urlSlotTarget === 'interactive') {
        setInteractiveImage(newImg);
      } else if (urlSlotTarget === 'past') {
        setPastImage(newImg);
      } else if (urlSlotTarget === 'new') {
        setNewImage(newImg);
      }

      setUrlInput('');
      setShowUrlDialog(false);
      setUrlError('');
      setInlineWarning(null);
      setIsAttachMenuOpen(false);
    } catch {
      setUrlError('Please enter a valid HTTP or HTTPS image URL.');
    }
  };

  const handleApiConnectSuccess = (image: AttachedImage, slot?: 'interactive' | 'past' | 'new') => {
    const target = slot || apiKeyModalSlot;
    if (target === 'interactive') {
      setInteractiveImage(image);
    } else if (target === 'past') {
      setPastImage(image);
    } else if (target === 'new') {
      setNewImage(image);
    }
    setInlineWarning(null);
    setIsApiKeyModalOpen(false);
  };

  // =========================================================================
  // EXECUTE / ANALYSE & TERMINATE
  // =========================================================================

  const terminateCurrentAnalysis = () => {
    abortRef.current = true;
    if (mode === 'interactive') {
      setInteractiveLoading(false);
      setInteractiveLoadingStep('');
      setInteractiveMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, isLoading: false, text: 'Analysis terminated by operator.' }
            : m
        )
      );
    } else {
      setComparisonLoading(false);
      setComparisonLoadingStep('');
      setComparisonMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, isLoading: false, text: 'Analysis terminated by operator.' }
            : m
        )
      );
    }
  };

  const executeAnalysis = async (customPrompt?: string, presetAnswerKey?: string) => {
    const queryText = (customPrompt ?? currentPrompt).trim();

    // Validation for Interactive Mode
    if (mode === 'interactive') {
      if (!interactiveImage) {
        setInlineWarning('Add an image to begin.');
        return;
      }
      if (!queryText) {
        return;
      }
    }

    // Validation for Comparison Mode
    if (mode === 'comparison') {
      if (!pastImage && !newImage) {
        setInlineWarning('Please place two images to compare.');
        return;
      }
      if (!pastImage) {
        setInlineWarning('Add the past image to continue.');
        return;
      }
      if (!newImage) {
        setInlineWarning('Add the new image to continue.');
        return;
      }
      if (!queryText) {
        return;
      }
    }

    setInlineWarning(null);
    abortRef.current = false;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add User Message
    const userMsgId = `usr-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      timestamp,
      text: queryText,
      images: mode === 'comparison' && pastImage && newImage
        ? [pastImage, newImage]
        : interactiveImage ? [interactiveImage] : [],
      mode,
      comparisonPair: mode === 'comparison' && pastImage && newImage
        ? { before: pastImage, after: newImage }
        : undefined
    };

    // 2. Add Loading Message
    const drishtiMsgId = `dri-${Date.now()}`;
    const loadingMessage: Message = {
      id: drishtiMsgId,
      sender: 'drishti',
      timestamp,
      text: 'Analysing satellite pixels...',
      isLoading: true,
      loadingStep: 'Ingesting Multi-spectral Bands (Step 1/4)...',
      mode
    };

    if (mode === 'interactive') {
      setInteractiveMessages(prev => [...prev, userMessage, loadingMessage]);
      setInteractivePrompt('');
      setInteractiveLoading(true);
      setInteractiveLoadingStep('Ingesting Multi-spectral Bands (Step 1/4)...');
    } else {
      setComparisonMessages(prev => [...prev, userMessage, loadingMessage]);
      setComparisonPrompt('');
      setComparisonLoading(true);
      setComparisonLoadingStep('Coregistering Bi-Temporal Rasters (Step 1/4)...');
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      let finalAnswer: DrishtiAnswer;

      if (presetAnswerKey && DEMO_ANSWERS[presetAnswerKey]) {
        // Run simulation with step updates
        await drishtiEngine.analyze(
          {
            prompt: queryText,
            mode,
            images: mode === 'comparison' && pastImage && newImage
              ? [pastImage, newImage]
              : interactiveImage ? [interactiveImage] : [],
            comparisonPair: mode === 'comparison' && pastImage && newImage
              ? { before: pastImage, after: newImage }
              : undefined
          },
          step => {
            if (abortRef.current) return;
            if (mode === 'interactive') {
              setInteractiveLoadingStep(step);
              setInteractiveMessages(prev =>
                prev.map(m => (m.id === drishtiMsgId ? { ...m, loadingStep: step } : m))
              );
            } else {
              setComparisonLoadingStep(step);
              setComparisonMessages(prev =>
                prev.map(m => (m.id === drishtiMsgId ? { ...m, loadingStep: step } : m))
              );
            }
          }
        );
        finalAnswer = DEMO_ANSWERS[presetAnswerKey];
      } else {
        finalAnswer = await drishtiEngine.analyze(
          {
            prompt: queryText,
            mode,
            images: mode === 'comparison' && pastImage && newImage
              ? [pastImage, newImage]
              : interactiveImage ? [interactiveImage] : [],
            comparisonPair: mode === 'comparison' && pastImage && newImage
              ? { before: pastImage, after: newImage }
              : undefined
          },
          step => {
            if (abortRef.current) return;
            if (mode === 'interactive') {
              setInteractiveLoadingStep(step);
              setInteractiveMessages(prev =>
                prev.map(m => (m.id === drishtiMsgId ? { ...m, loadingStep: step } : m))
              );
            } else {
              setComparisonLoadingStep(step);
              setComparisonMessages(prev =>
                prev.map(m => (m.id === drishtiMsgId ? { ...m, loadingStep: step } : m))
              );
            }
          }
        );
      }

      if (abortRef.current) return;

      const updateResult = (prev: Message[]) =>
        prev.map(m =>
          m.id === drishtiMsgId
            ? {
                ...m,
                isLoading: false,
                loadingStep: undefined,
                text: finalAnswer.summary,
                answer: finalAnswer
              }
            : m
        );

      if (mode === 'interactive') {
        setInteractiveMessages(updateResult);
        setInteractiveLoading(false);
        setInteractiveLoadingStep('');
      } else {
        setComparisonMessages(updateResult);
        setComparisonLoading(false);
        setComparisonLoadingStep('');
      }
    } catch (err) {
      console.error('Drishti engine error:', err);
      if (mode === 'interactive') {
        setInteractiveLoading(false);
      } else {
        setComparisonLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isCurrentSubmitting) {
        executeAnalysis();
      }
    }
  };

  // Verdict Badge Renderer
  const renderVerdictBadge = (verdict: VerdictType) => {
    switch (verdict) {
      case 'ANSWERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30">
            <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
            ANSWERED
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/30">
            <AlertTriangle className="w-3 h-3 text-[#FBBF24]" />
            UNCERTAIN
          </span>
        );
      case 'REFUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/30">
            <XCircle className="w-3 h-3 text-[#F87171]" />
            REFUSED
          </span>
        );
    }
  };

  // Preset quick loader
  const loadPresetComparison = (type: 'forest' | 'flood') => {
    if (type === 'forest') {
      setPastImage(SAMPLE_IMAGES.forestBefore);
      setNewImage(SAMPLE_IMAGES.forestAfter);
      setComparisonPrompt('What changed between these images? Detect deforestation cuts and roads.');
    } else {
      setPastImage(SAMPLE_IMAGES.floodBefore);
      setNewImage(SAMPLE_IMAGES.floodAfter);
      setComparisonPrompt('Detect flood water extent changes between baseline and post-monsoon.');
    }
    setInlineWarning(null);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-[#05070F] text-[#E8EEFC] relative selection:bg-[#22D3EE]/30 selection:text-[#22D3EE]">
      {/* Hidden file pickers */}
      <input
        type="file"
        ref={interactiveFileInputRef}
        onChange={e => handleDeviceFileUpload(e, 'interactive')}
        accept="image/png, image/jpeg, image/tiff, .tif, .tiff"
        className="hidden"
      />
      <input
        type="file"
        ref={pastFileInputRef}
        onChange={e => handleDeviceFileUpload(e, 'past')}
        accept="image/png, image/jpeg, image/tiff, .tif, .tiff"
        className="hidden"
      />
      <input
        type="file"
        ref={newFileInputRef}
        onChange={e => handleDeviceFileUpload(e, 'new')}
        accept="image/png, image/jpeg, image/tiff, .tif, .tiff"
        className="hidden"
      />
      <input
        type="file"
        ref={generalFileInputRef}
        onChange={e => handleDeviceFileUpload(e)}
        accept="image/png, image/jpeg, image/tiff, .tif, .tiff"
        className="hidden"
      />

      {/* Main Thread Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-44 max-w-4xl w-full mx-auto space-y-6">
        {/* ===================================================================
            EMPTY STATES (When a mode has no messages yet)
        =================================================================== */}
        {currentMessages.length === 0 && (
          <div className="py-8 sm:py-12 animate-in fade-in duration-300">
            {mode === 'interactive' ? (
              /* INTERACTIVE EMPTY STATE: Calm, generous landing */
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-[#E8EEFC] tracking-tight">
                    What would you like to see?
                  </h1>
                  <p className="text-sm text-[#8A97B8] mt-1.5">
                    Drop a satellite image to begin, or pick a sample below.
                  </p>
                </div>

                {/* Single Large Elegant Dropzone */}
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setInteractiveImage(createAttachedImageFromFile(file, 'single'));
                      setInlineWarning(null);
                    }
                  }}
                  className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all bg-[#0A0F1D] flex flex-col items-center justify-center gap-3 group ${
                    interactiveImage
                      ? 'border-[#22D3EE]/50 bg-[#0F1627]'
                      : 'border-[#151D33] hover:border-[#22D3EE]/40 hover:bg-[#0A0F1D]/80'
                  }`}
                >
                  {interactiveImage ? (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <img
                        src={interactiveImage.url}
                        alt={interactiveImage.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-[#151D33] shadow-lg"
                      />
                      <div className="text-center">
                        <div className="font-mono text-xs font-semibold text-[#E8EEFC] truncate max-w-xs">
                          {interactiveImage.name}
                        </div>
                        <div className="text-[11px] text-[#8A97B8] font-mono mt-0.5">
                          {interactiveImage.format} • {interactiveImage.size} • {interactiveImage.sensor}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => interactiveFileInputRef.current?.click()}
                          className="px-3 py-1 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs font-mono text-[#E8EEFC] border border-[#151D33] transition-colors"
                        >
                          Replace image
                        </button>
                        <button
                          type="button"
                          onClick={() => setInteractiveImage(null)}
                          className="px-2 py-1 rounded-lg text-xs font-mono text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-[#0F1627] border border-[#151D33] flex items-center justify-center text-[#22D3EE] group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-[#E8EEFC]">
                          Drop your satellite raster or orthomosaic here
                        </p>
                        <p className="text-xs text-[#8A97B8] mt-1">
                          Supports GeoTIFF (.tif), PNG, JPG up to 50 MB
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => interactiveFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#E8EEFC] border border-[#151D33] transition-colors"
                        >
                          Browse device
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUrlSlotTarget('interactive');
                            setShowUrlDialog(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] transition-colors"
                        >
                          Paste URL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setApiKeyModalSlot('interactive');
                            setIsApiKeyModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#22D3EE] border border-[#151D33] transition-colors"
                        >
                          Connect dataset
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Four Minimal Suggestion Chips */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono text-[#5A6685] uppercase tracking-wider">
                    Or test with a calibrated sample
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInteractiveImage(SAMPLE_IMAGES.urban);
                        executeAnalysis('Count building footprints and classify structural density.', 'buildings');
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#0A0F1D] hover:bg-[#0F1627] text-xs text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] hover:border-[#22D3EE]/30 transition-all flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Count buildings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInteractiveImage(SAMPLE_IMAGES.water);
                        executeAnalysis('Map surface water body area using NDWI spectral index.', 'water');
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#0A0F1D] hover:bg-[#0F1627] text-xs text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] hover:border-[#22D3EE]/30 transition-all flex items-center gap-1.5"
                    >
                      <Droplets className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Map surface water</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInteractiveImage(SAMPLE_IMAGES.cloudy);
                        executeAnalysis('Estimate cloud coverage percentage and check optical occlusion.', 'uncertainCloud');
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#0A0F1D] hover:bg-[#0F1627] text-xs text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] hover:border-[#FBBF24]/30 transition-all flex items-center gap-1.5"
                    >
                      <CloudOff className="w-3.5 h-3.5 text-[#FBBF24]" />
                      <span>Check cloud coverage</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInteractiveImage(SAMPLE_IMAGES.urban);
                        executeAnalysis('Identify civilian faces or license plates on this road.', 'refusedBiometrics');
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#0A0F1D] hover:bg-[#0F1627] text-xs text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] hover:border-[#F87171]/30 transition-all flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#F87171]" />
                      <span>Policy safety check</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* COMPARISON EMPTY STATE: Two drop zones side-by-side */
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-[#E8EEFC] tracking-tight">
                    Compare two moments
                  </h1>
                  <p className="text-sm text-[#8A97B8] mt-1.5">
                    Place a past and a new image to detect what changed.
                  </p>
                </div>

                {/* The Two Drop Zones Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PAST IMAGE SLOT */}
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        setPastImage(createAttachedImageFromFile(file, 'before'));
                        setInlineWarning(null);
                      }
                    }}
                    className={`p-6 rounded-2xl border-2 border-dashed bg-[#0A0F1D] flex flex-col items-center justify-center gap-3 transition-all ${
                      pastImage
                        ? 'border-[#151D33] bg-[#0F1627]'
                        : comparisonMissingSlot === 'past'
                        ? 'border-[#22D3EE]/60 shadow-[0_0_16px_rgba(34,211,238,0.15)] animate-pulse'
                        : 'border-[#151D33] hover:border-[#8A97B8]/40'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#8A97B8] uppercase">
                      PAST IMAGE (EARLIER DATE)
                    </span>

                    {pastImage ? (
                      <div className="flex flex-col items-center gap-2.5 w-full">
                        <img
                          src={pastImage.url}
                          alt={pastImage.name}
                          className="w-20 h-20 rounded-xl object-cover border border-[#151D33] shadow"
                        />
                        <div className="text-center">
                          <div className="font-mono text-xs text-[#E8EEFC] truncate max-w-[200px]">
                            {pastImage.name}
                          </div>
                          <div className="text-[10px] text-[#8A97B8] font-mono mt-0.5">
                            {pastImage.size} • {pastImage.sensor || 'Baseline'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => pastFileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-[#0A0F1D] hover:bg-[#151D33] text-xs font-mono text-[#E8EEFC] border border-[#151D33]"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setPastImage(null)}
                            className="px-2 py-1 rounded-lg text-xs font-mono text-[#F87171] hover:bg-[#F87171]/10"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-[#0F1627] border border-[#151D33] flex items-center justify-center text-[#8A97B8]">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-[#8A97B8] text-center">
                          Upload, paste URL or connect dataset
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => pastFileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#E8EEFC] border border-[#151D33]"
                          >
                            Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUrlSlotTarget('past');
                              setShowUrlDialog(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#8A97B8] border border-[#151D33]"
                          >
                            URL
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setApiKeyModalSlot('past');
                              setIsApiKeyModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#22D3EE] border border-[#151D33]"
                          >
                            Dataset
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* NEW IMAGE SLOT */}
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        setNewImage(createAttachedImageFromFile(file, 'after'));
                        setInlineWarning(null);
                      }
                    }}
                    className={`p-6 rounded-2xl border-2 border-dashed bg-[#0A0F1D] flex flex-col items-center justify-center gap-3 transition-all ${
                      newImage
                        ? 'border-[#151D33] bg-[#0F1627]'
                        : comparisonMissingSlot === 'new'
                        ? 'border-[#22D3EE]/60 shadow-[0_0_16px_rgba(34,211,238,0.15)] animate-pulse'
                        : 'border-[#151D33] hover:border-[#8A97B8]/40'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#22D3EE] uppercase">
                      NEW IMAGE (LATER DATE)
                    </span>

                    {newImage ? (
                      <div className="flex flex-col items-center gap-2.5 w-full">
                        <img
                          src={newImage.url}
                          alt={newImage.name}
                          className="w-20 h-20 rounded-xl object-cover border border-[#151D33] shadow"
                        />
                        <div className="text-center">
                          <div className="font-mono text-xs text-[#E8EEFC] truncate max-w-[200px]">
                            {newImage.name}
                          </div>
                          <div className="text-[10px] text-[#8A97B8] font-mono mt-0.5">
                            {newImage.size} • {newImage.sensor || 'Current'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => newFileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-[#0A0F1D] hover:bg-[#151D33] text-xs font-mono text-[#E8EEFC] border border-[#151D33]"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewImage(null)}
                            className="px-2 py-1 rounded-lg text-xs font-mono text-[#F87171] hover:bg-[#F87171]/10"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-[#0F1627] border border-[#151D33] flex items-center justify-center text-[#22D3EE]">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-[#8A97B8] text-center">
                          Upload, paste URL or connect dataset
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => newFileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#E8EEFC] border border-[#151D33]"
                          >
                            Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUrlSlotTarget('new');
                              setShowUrlDialog(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#8A97B8] border border-[#151D33]"
                          >
                            URL
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setApiKeyModalSlot('new');
                              setIsApiKeyModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-xs text-[#22D3EE] border border-[#151D33]"
                          >
                            Dataset
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Two One-Click Presets */}
                <div className="space-y-2 pt-2 text-center">
                  <div className="text-[11px] font-mono text-[#5A6685] uppercase tracking-wider">
                    Quick test presets (populates both slots)
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadPresetComparison('forest')}
                      className="px-3.5 py-1.5 rounded-full bg-[#0A0F1D] hover:bg-[#0F1627] text-xs text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] hover:border-[#22D3EE]/30 transition-all flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Forest loss (2020 vs 2024)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPresetComparison('flood')}
                      className="px-3.5 py-1.5 rounded-full bg-[#0A0F1D] hover:bg-[#0F1627] text-xs text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] hover:border-[#22D3EE]/30 transition-all flex items-center gap-1.5"
                    >
                      <Droplets className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Flood extent (Baseline vs Post-Event)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            MESSAGE THREAD (When messages exist)
        =================================================================== */}
        {currentMessages.length > 0 && (
          <div className="flex items-center justify-between pb-2 border-b border-[#151D33]/40">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#5A6685]">
              {mode === 'interactive' ? 'Interactive Session' : 'Bi-Temporal Comparison Session'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (mode === 'interactive') {
                  setInteractiveMessages([]);
                } else {
                  setComparisonMessages([]);
                }
              }}
              className="text-[11px] font-mono text-[#8A97B8] hover:text-[#F87171] transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear thread</span>
            </button>
          </div>
        )}

        {currentMessages.map(msg => {
          const isUser = msg.sender === 'user';

          // User message: right-aligned, quiet bubble (surface-2), small image thumbnail(s)
          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="max-w-2xl bg-[#0F1627] border border-[#151D33] rounded-2xl p-4 shadow-md space-y-2.5">
                  <p className="text-sm text-[#E8EEFC] leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {/* Attached Image Thumbnails */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#151D33]">
                      {msg.images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0A0F1D] border border-[#151D33] text-xs"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-7 h-7 rounded object-cover border border-[#151D33]"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-mono text-[#E8EEFC] truncate max-w-[130px]">
                              {img.name}
                            </div>
                            <div className="text-[9px] text-[#8A97B8] font-mono">
                              {img.format || 'Raster'} • {img.size || 'Calibrated'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-[#5A6685] font-mono text-right">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          }

          // Drishti Loading State: 3 small pulsing dots + loading step text (NO heavy placeholder)
          if (msg.isLoading) {
            return (
              <div key={msg.id} className="flex items-start gap-3 animate-in fade-in duration-150 py-2">
                <img
                  src="/logo.png"
                  alt="Drishti Avatar"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-7 h-7 rounded-[7px] object-contain border border-[#151D33] shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-[#E8EEFC]">
                    <span>Analysing satellite pixels...</span>
                    {/* 3 small pulsing dots */}
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse [animation-delay:200ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse [animation-delay:400ms]" />
                    </div>
                  </div>
                  <p className="text-xs font-mono text-[#8A97B8]">
                    {msg.loadingStep || 'Verifying spatial coordinates and spectral signatures'}
                  </p>
                </div>
              </div>
            );
          }

          // Drishti Plain Text Message (when no structured answer): sits directly on the background
          if (!msg.answer) {
            return (
              <div key={msg.id} className="flex items-start gap-3 animate-in fade-in duration-150 py-1">
                <img
                  src="/logo.png"
                  alt="Drishti Avatar"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-7 h-7 rounded-[7px] object-contain border border-[#151D33] shrink-0 mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-[#8A97B8]">
                      Drishti
                    </span>
                    <span className="text-[10px] font-mono text-[#5A6685]">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-[#E8EEFC] leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          }

          // Drishti Structured Result Card
          const answer = msg.answer;
          return (
            <div
              key={msg.id}
              className="rounded-[20px] bg-[#0A0F1D] border border-[#151D33] shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden space-y-4 p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              {/* Header: Small verdict pill, mono timestamp, and headline in bold */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#151D33] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/logo.png"
                      alt="Drishti"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-5 h-5 rounded-[5px] object-contain"
                    />
                    <span className="text-xs font-mono text-[#8A97B8]">
                      Drishti Intelligence
                    </span>
                    <span className="text-[10px] font-mono text-[#5A6685]">
                      {msg.timestamp}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#E8EEFC] tracking-tight">
                    {answer.headline}
                  </h3>
                </div>

                <div>
                  {renderVerdictBadge(answer.verdict)}
                </div>
              </div>

              {/* Metric Callout & Verdict Audit reason */}
              {answer.metricValue && (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#22D3EE]">
                    {answer.metricValue}
                  </span>
                  {answer.metricUnit && (
                    <span className="text-xs font-mono text-[#8A97B8] uppercase">
                      {answer.metricUnit}
                    </span>
                  )}
                </div>
              )}

              {/* Text Summary */}
              <p className="text-sm text-[#E8EEFC] leading-relaxed">
                {answer.summary}
              </p>

              {/* Body: Evidence Viewer (EvidenceImageViewer or ComparisonSlider) */}
              <div className="pt-1">
                {msg.mode === 'comparison' && msg.comparisonPair ? (
                  <ComparisonSlider
                    beforeImage={msg.comparisonPair.before}
                    afterImage={msg.comparisonPair.after}
                    polygons={answer.polygons}
                  />
                ) : (
                  answer.imageUrl && (
                    <EvidenceImageViewer
                      imageUrl={answer.imageUrl}
                      imageAlt={answer.imageAlt}
                      boxes={answer.boxes}
                      polygons={answer.polygons}
                      verdict={answer.verdict}
                      confidenceScore={answer.confidenceScore}
                    />
                  )
                )}
              </div>

              {/* Category Breakdown Tags */}
              {answer.categoryBreakdown && answer.categoryBreakdown.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono text-[#5A6685] mr-1">
                    Detected Classes:
                  </span>
                  {answer.categoryBreakdown.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#0F1627] border border-[#151D33] text-[#E8EEFC] flex items-center gap-1.5"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: item.color || '#22D3EE' }}
                      />
                      {item.label}: <strong className="text-[#E8EEFC]">{item.count}</strong>
                    </span>
                  ))}
                </div>
              )}

              {/* Footer: Collapsed Audit Trail Disclosure */}
              {answer.auditTrail && answer.auditTrail.length > 0 && (
                <div className="pt-2">
                  <AuditTrail
                    checks={answer.auditTrail}
                    confidenceScore={answer.confidenceScore}
                    verdict={answer.verdict}
                    defaultExpanded={false}
                  />
                </div>
              )}
            </div>
          );
        })}

        <div ref={threadEndRef} />
      </main>

      {/* ===================================================================
          FLOATING BOTTOM COMPOSER
          Rounded 24px, max-width ~840px, centred, floating ~24px above bottom edge
      =================================================================== */}
      <div className="fixed bottom-6 left-0 right-0 z-30 px-4 pointer-events-none">
        <div className="max-w-[840px] mx-auto pointer-events-auto">
          {/* Inline warning notification above composer */}
          {inlineWarning && (
            <div className="mb-2 px-3.5 py-1.5 rounded-xl bg-[#0A0F1D] border border-[#FBBF24]/30 text-xs font-mono text-[#FBBF24] flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{inlineWarning}</span>
            </div>
          )}

          {/* Thin Indeterminate Line under or above composer when running */}
          {isCurrentSubmitting && (
            <div className="h-0.5 w-full bg-[#151D33] overflow-hidden rounded-full mb-1.5">
              <div className="bg-[#22D3EE] h-full w-1/3 animate-[indeterminate_1.5s_infinite_linear] rounded-full" />
            </div>
          )}

          {/* Main Floating Container */}
          <div className="rounded-[24px] bg-[#0A0F1D] border border-[#151D33] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] p-3 sm:p-4 space-y-2.5 transition-all">
            {/* Top row: File Chip(s) with Replace/Remove */}
            {mode === 'interactive' && interactiveImage && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-[#0F1627] border border-[#151D33] text-xs">
                  <img
                    src={interactiveImage.url}
                    alt={interactiveImage.name}
                    className="w-5 h-5 rounded object-cover border border-[#151D33]"
                  />
                  <span className="font-mono text-[11px] text-[#E8EEFC] truncate max-w-[180px]">
                    {interactiveImage.name}
                  </span>
                  <span className="text-[9px] font-mono text-[#8A97B8]">
                    {interactiveImage.format}
                  </span>
                  <button
                    type="button"
                    onClick={() => interactiveFileInputRef.current?.click()}
                    className="text-[10px] font-mono text-[#22D3EE] hover:underline ml-1"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setInteractiveImage(null)}
                    title="Remove image"
                    className="p-0.5 rounded text-[#8A97B8] hover:text-[#F87171] ml-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {mode === 'comparison' && (pastImage || newImage) && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                {/* Past Image Chip */}
                {pastImage ? (
                  <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-[#0F1627] border border-[#151D33] text-xs">
                    <span className="text-[9px] font-mono font-bold text-[#8A97B8] uppercase">PAST:</span>
                    <img
                      src={pastImage.url}
                      alt={pastImage.name}
                      className="w-5 h-5 rounded object-cover border border-[#151D33]"
                    />
                    <span className="font-mono text-[11px] text-[#E8EEFC] truncate max-w-[140px]">
                      {pastImage.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => pastFileInputRef.current?.click()}
                      className="text-[10px] font-mono text-[#8A97B8] hover:text-[#E8EEFC] ml-1"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setPastImage(null)}
                      title="Remove past image"
                      className="p-0.5 rounded text-[#8A97B8] hover:text-[#F87171] ml-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pastFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-xl border border-dashed border-[#22D3EE]/50 text-xs font-mono text-[#22D3EE] bg-[#0F1627]/60 hover:bg-[#0F1627] flex items-center gap-1.5 animate-pulse"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Past Image</span>
                  </button>
                )}

                {/* New Image Chip */}
                {newImage ? (
                  <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-[#0F1627] border border-[#151D33] text-xs">
                    <span className="text-[9px] font-mono font-bold text-[#22D3EE] uppercase">NEW:</span>
                    <img
                      src={newImage.url}
                      alt={newImage.name}
                      className="w-5 h-5 rounded object-cover border border-[#151D33]"
                    />
                    <span className="font-mono text-[11px] text-[#E8EEFC] truncate max-w-[140px]">
                      {newImage.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => newFileInputRef.current?.click()}
                      className="text-[10px] font-mono text-[#8A97B8] hover:text-[#E8EEFC] ml-1"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewImage(null)}
                      title="Remove new image"
                      className="p-0.5 rounded text-[#8A97B8] hover:text-[#F87171] ml-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => newFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-xl border border-dashed border-[#22D3EE]/50 text-xs font-mono text-[#22D3EE] bg-[#0F1627]/60 hover:bg-[#0F1627] flex items-center gap-1.5 animate-pulse"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New Image</span>
                  </button>
                )}

                {isComparisonReady && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(34,211,238,0.12)] text-[#22D3EE] border border-[#22D3EE]/30 ml-auto">
                    2 IMAGES READY
                  </span>
                )}
              </div>
            )}

            {/* Middle: Auto-resizing textarea */}
            <textarea
              ref={textareaRef}
              value={currentPrompt}
              onChange={e => {
                setCurrentPrompt(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              disabled={mode === 'comparison' && !isComparisonReady}
              rows={1}
              placeholder={
                mode === 'comparison'
                  ? !isComparisonReady
                    ? 'Place two images above to enable comparison query...'
                    : 'What changed between these images? Ask about canopy loss, new roads, or flood boundaries...'
                  : 'Ask a question in plain English (e.g. "How many buildings are here?", "Where is the water?")...'
              }
              className="w-full px-2 py-1 bg-transparent text-sm text-[#E8EEFC] placeholder:text-[#5A6685] focus:outline-none resize-none min-h-[44px] max-h-[160px] leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed"
            />

            {/* Bottom Row Controls */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#151D33]/60 relative">
              {/* Left: + Button and Suggestions Button */}
              <div className="flex items-center gap-2">
                {/* + Attach Popover Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAttachMenuOpen(v => !v)}
                    title="Attach image or dataset"
                    className="p-2 rounded-xl bg-[#0F1627] hover:bg-[#151D33] text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] transition-all flex items-center justify-center active:scale-95"
                  >
                    <Plus className={`w-4 h-4 transition-transform duration-150 ${isAttachMenuOpen ? 'rotate-45' : ''}`} />
                  </button>

                  {/* Clean Popover */}
                  {isAttachMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#0A0F1D] border border-[#151D33] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="px-2.5 py-1 border-b border-[#151D33] text-[10px] font-mono uppercase tracking-wider text-[#5A6685]">
                        Attach Satellite Source
                      </div>

                      <div className="space-y-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttachMenuOpen(false);
                            if (mode === 'interactive') {
                              interactiveFileInputRef.current?.click();
                            } else if (!pastImage) {
                              pastFileInputRef.current?.click();
                            } else {
                              newFileInputRef.current?.click();
                            }
                          }}
                          className="w-full px-2.5 py-2 rounded-xl hover:bg-[#0F1627] text-left flex items-center gap-2.5 text-xs text-[#E8EEFC] transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>Upload from device</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAttachMenuOpen(false);
                            setUrlSlotTarget(mode === 'interactive' ? 'interactive' : !pastImage ? 'past' : 'new');
                            setShowUrlDialog(true);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl hover:bg-[#0F1627] text-left flex items-center gap-2.5 text-xs text-[#E8EEFC] transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>Paste image URL</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAttachMenuOpen(false);
                            setApiKeyModalSlot(mode === 'interactive' ? 'interactive' : !pastImage ? 'past' : 'new');
                            setIsApiKeyModalOpen(true);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl hover:bg-[#0F1627] text-left flex items-center gap-2.5 text-xs text-[#E8EEFC] transition-colors"
                        >
                          <Key className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>Connect dataset API</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions Button */}
                <button
                  type="button"
                  onClick={() => setShowSuggestions(v => !v)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showSuggestions
                      ? 'bg-[rgba(34,211,238,0.12)] text-[#22D3EE] border-[#22D3EE]/40'
                      : 'bg-[#0F1627] text-[#8A97B8] hover:text-[#E8EEFC] border-[#151D33]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Suggestions</span>
                </button>
              </div>

              {/* Right: Analyse / Terminate Button */}
              <div className="flex items-center gap-2">
                {isCurrentSubmitting ? (
                  /* TERMINATE BUTTON: Red text/icon that cancels cleanly */
                  <button
                    type="button"
                    onClick={terminateCurrentAnalysis}
                    title="Terminate in-flight analysis"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#F87171] bg-[#F87171]/15 border border-[#F87171]/35 hover:bg-[#F87171]/25 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Terminate</span>
                  </button>
                ) : (
                  /* ANALYSE BUTTON: Accent colour #22D3EE, rounded 12px, clean icon */
                  <button
                    type="button"
                    onClick={() => executeAnalysis()}
                    disabled={
                      (mode === 'comparison' && !isComparisonReady) ||
                      (mode === 'interactive' && !interactiveImage) ||
                      !currentPrompt.trim()
                    }
                    title="Analyse (Enter)"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#05070F] bg-[#22D3EE] hover:bg-[#22D3EE]/90 disabled:opacity-30 disabled:hover:bg-[#22D3EE] shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Analyse</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions Drawer (when toggled) */}
            {showSuggestions && (
              <div className="pt-2 border-t border-[#151D33] flex flex-wrap gap-1.5 animate-in fade-in duration-150">
                {SUGGESTED_CHIPS.map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      if (chip.switchToComparison) {
                        onModeChange('comparison');
                        setPastImage(SAMPLE_IMAGES.forestBefore);
                        setNewImage(SAMPLE_IMAGES.forestAfter);
                      } else {
                        const sImg = SAMPLE_IMAGES[chip.imageKey];
                        if (sImg) setInteractiveImage(sImg);
                      }
                      setCurrentPrompt(chip.label);
                      setShowSuggestions(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#0F1627] hover:bg-[#151D33] text-[11px] font-mono text-[#8A97B8] hover:text-[#E8EEFC] border border-[#151D33] transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Single faint helper text line below composer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#5A6685] mt-1.5 px-3">
            <span>Enter to send • Shift+Enter for new line</span>
            <span className="flex items-center gap-1 text-[#8A97B8]">
              <ShieldCheck className="w-3 h-3 text-[#22D3EE]" /> Evidence, not guesses.
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================
          MODALS: Web URL Input & Dataset Sourcing Dialog
      =================================================================== */}

      {/* Web URL Modal */}
      {showUrlDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070F]/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0A0F1D] border border-[#151D33] rounded-[20px] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#E8EEFC]">
                Load Satellite Image from Web URL
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowUrlDialog(false);
                  setUrlError('');
                }}
                className="text-[#8A97B8] hover:text-[#E8EEFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://example.com/satellite-tile.jpg"
                className="w-full px-3 py-2 bg-[#0F1627] border border-[#151D33] rounded-xl text-xs text-[#E8EEFC] placeholder:text-[#5A6685] focus:outline-none focus:border-[#22D3EE]"
                autoFocus
              />

              {urlError && (
                <p className="text-[11px] text-[#F87171] font-mono">{urlError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlDialog(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#8A97B8] hover:text-[#E8EEFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#22D3EE] text-[#05070F] font-semibold text-xs hover:bg-[#22D3EE]/90"
                >
                  Load Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dataset API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        mode={mode}
        defaultSlot={apiKeyModalSlot}
        onConnectSuccess={handleApiConnectSuccess}
      />
    </div>
  );
};
