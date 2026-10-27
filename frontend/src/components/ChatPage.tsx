import React, { useState, useRef, useEffect } from 'react';
import {
  AppMode,
  Message,
  AttachedImage,
  DrishtiAnswer,
  VerdictType,
  BoundingBox,
  PolygonOutline
} from '../types';
import { useTheme } from '../context/ThemeContext';
import { EvidenceImageViewer } from './EvidenceImageViewer';
import { ComparisonSlider } from './ComparisonSlider';
import { AuditTrail } from './AuditTrail';
import { AttachMenu } from './AttachMenu';
import { ThemeSelector } from './ThemeSelector';
import { drishtiEngine } from '../services/api';
import {
  SAMPLE_IMAGES,
  DEMO_ANSWERS,
  SUGGESTED_CHIPS
} from '../constants/sampleData';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  FileText,
  Loader2,
  Trash2,
  ArrowRight,
  Maximize2,
  ShieldCheck,
  Building2,
  Droplets,
  Layers,
  CloudOff,
  ShieldAlert,
  Compass
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
  const { themeConfig } = useTheme();

  // Comparison mode pair states
  const [beforeImage, setBeforeImage] = useState<AttachedImage>(SAMPLE_IMAGES.forestBefore);
  const [afterImage, setAfterImage] = useState<AttachedImage>(SAMPLE_IMAGES.forestAfter);

  // Attached images in the prompt input bar (for interactive mode)
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([SAMPLE_IMAGES.urban]);

  // Message thread state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-seed-1',
      sender: 'drishti',
      timestamp: '10:14 AM',
      text: 'Welcome to Drishti. I verify satellite imagery questions through mathematical evidence, spectral indexes, and strict safety guardrails.\n\nAsk me in plain English to count structures, map water bodies, or detect change across dates.',
      answer: undefined
    }
  ]);

  // Text input value
  const [inputText, setInputText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // Add attached image
  const handleAddImage = (img: AttachedImage) => {
    setAttachedImages(prev => {
      // Limit to 3 active images
      const filtered = prev.filter(item => item.id !== img.id);
      return [...filtered, img];
    });
  };

  // Remove attached image
  const handleRemoveImage = (id: string) => {
    setAttachedImages(prev => prev.filter(img => img.id !== id));
  };

  // Execute an analysis query
  const executeQuery = async (queryText: string, customImage?: AttachedImage, presetAnswerKey?: string) => {
    if (!queryText.trim() && !customImage && attachedImages.length === 0) return;

    const currentImg = customImage || (attachedImages.length > 0 ? attachedImages[attachedImages.length - 1] : SAMPLE_IMAGES.urban);

    // 1. Add user message
    const userMsgId = `msg-user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: queryText,
      images: mode === 'comparison' ? [beforeImage, afterImage] : [currentImg],
      mode
    };

    // 2. Add loading skeleton card
    const drishtiMsgId = `msg-drishti-${Date.now()}`;
    const loadingMessage: Message = {
      id: drishtiMsgId,
      sender: 'drishti',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Analysing satellite pixels and verifying spatial evidence...',
      isLoading: true,
      loadingStep: 'Ingesting Multi-spectral Bands (Step 1/4)...',
      mode
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsSubmitting(true);

    try {
      let finalAnswer: DrishtiAnswer;

      if (presetAnswerKey && DEMO_ANSWERS[presetAnswerKey]) {
        // Preset sample query simulation
        await drishtiEngine.analyze(
          {
            prompt: queryText,
            mode,
            images: mode === 'comparison' ? [beforeImage, afterImage] : [currentImg],
            comparisonPair: mode === 'comparison' ? { before: beforeImage, after: afterImage } : undefined
          },
          step => {
            setMessages(prev =>
              prev.map(m => (m.id === drishtiMsgId ? { ...m, loadingStep: step } : m))
            );
          }
        );
        finalAnswer = DEMO_ANSWERS[presetAnswerKey];
      } else {
        // Real API or local fallback engine call
        finalAnswer = await drishtiEngine.analyze(
          {
            prompt: queryText,
            mode,
            images: mode === 'comparison' ? [beforeImage, afterImage] : [currentImg],
            comparisonPair: mode === 'comparison' ? { before: beforeImage, after: afterImage } : undefined
          },
          step => {
            setMessages(prev =>
              prev.map(m => (m.id === drishtiMsgId ? { ...m, loadingStep: step } : m))
            );
          }
        );
      }

      setMessages(prev =>
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
        )
      );
    } catch (err) {
      console.error('Error during Drishti analysis:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting && (inputText.trim() || attachedImages.length > 0)) {
        executeQuery(inputText);
      }
    }
  };

  const handleChipClick = (chip: typeof SUGGESTED_CHIPS[0]) => {
    if (chip.switchToComparison) {
      onModeChange('comparison');
    }
    const sampleImg = SAMPLE_IMAGES[chip.imageKey];
    if (sampleImg && mode !== 'comparison') {
      setAttachedImages([sampleImg]);
    }
    executeQuery(chip.label, sampleImg, chip.answerKey);
  };

  const getVerdictBadge = (verdict: VerdictType) => {
    switch (verdict) {
      case 'ANSWERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ANSWERED
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            UNCERTAIN
          </span>
        );
      case 'REFUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            REFUSED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#05070d] text-slate-100 relative">
      {/* Background satellite grid lines */}
      <div className="absolute inset-0 satellite-grid pointer-events-none opacity-40 -z-10" />

      {/* COMPARISON MODE BANNER (When in comparison mode) */}
      {mode === 'comparison' && (
        <div className="border-b border-white/10 bg-slate-950/90 py-3 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <ComparisonSlider
              beforeImage={beforeImage}
              afterImage={afterImage}
              onUpdateBefore={setBeforeImage}
              onUpdateAfter={setAfterImage}
              onSelectPreset={preset => {
                if (preset === 'forest') {
                  setBeforeImage(SAMPLE_IMAGES.forestBefore);
                  setAfterImage(SAMPLE_IMAGES.forestAfter);
                } else if (preset === 'flood') {
                  setBeforeImage(SAMPLE_IMAGES.floodBefore);
                  setAfterImage(SAMPLE_IMAGES.floodAfter);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* CENTRE: SCROLLABLE MESSAGE THREAD */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-48 max-w-5xl w-full mx-auto space-y-6">
        {/* Suggestion Chips Banner (When thread is young) */}
        {messages.length <= 2 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Suggested Queries & Validation Cases
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Click any chip to test
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-xs text-slate-200 border border-white/10 hover:border-cyan-500/40 hover:text-cyan-300 transition-all text-left group shadow-sm disabled:opacity-50"
                >
                  <span className="text-cyan-400 group-hover:scale-110 transition-transform">
                    {chip.category === 'Object Counting' && <Building2 className="w-3.5 h-3.5" />}
                    {chip.category === 'Hydrology Mapping' && <Droplets className="w-3.5 h-3.5" />}
                    {chip.category === 'Change Detection' && <Layers className="w-3.5 h-3.5" />}
                    {chip.category === 'Uncertainty Test' && <CloudOff className="w-3.5 h-3.5 text-amber-400" />}
                    {chip.category === 'Safety & Refusal' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                  </span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Cards */}
        {messages.map(msg => {
          const isUser = msg.sender === 'user';

          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="max-w-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-white/15 rounded-2xl p-4 shadow-xl">
                  {/* Prompt Text */}
                  <p className="text-sm text-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>

                  {/* User Message Image Thumbnails */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-3 pt-2.5 border-t border-white/10">
                      {msg.images.map(img => (
                        <div
                          key={img.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-8 h-8 rounded object-cover border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-mono text-slate-300 truncate max-w-[140px]">
                              {img.name}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              {img.format || 'Orthomosaic'} • {img.size || '30cm'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 text-right mt-2 font-mono">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          }

          // Drishti Loading Skeleton State
          if (msg.isLoading) {
            return (
              <div
                key={msg.id}
                className="rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5 shadow-2xl backdrop-blur-md animate-pulse space-y-4 max-w-3xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest">
                        Analysing Satellite Pixels...
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {msg.loadingStep || 'Verifying spatial coordinates and spectral signatures'}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400/80 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    GPU INFERENCE
                  </span>
                </div>

                {/* Skeleton Image Placeholder with sweep effect */}
                <div className="h-44 sm:h-60 rounded-xl bg-slate-950/80 border border-white/10 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <div className="text-center space-y-2 z-10">
                    <Sparkles className="w-6 h-6 text-cyan-400 mx-auto animate-bounce" />
                    <span className="font-mono text-xs text-slate-400">
                      Processing Orthorectified Raster Layers
                    </span>
                  </div>
                </div>

                {/* Skeleton lines */}
                <div className="space-y-2">
                  <div className="h-4 bg-slate-800 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
                </div>
              </div>
            );
          }

          // Drishti Structured Response Card
          return (
            <div
              key={msg.id}
              className="rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md overflow-hidden max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {/* Structured Card Header: Headline, Metric & Verdict Badge */}
              <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/70">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-300 tracking-wider">
                          DRISHTI INTELLIGENCE
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {msg.timestamp}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                        {msg.answer?.headline || 'Analysis Result'}
                      </h3>
                    </div>
                  </div>

                  {/* Verdict Badge: ANSWERED (green), UNCERTAIN (amber), REFUSED (red) */}
                  {msg.answer && getVerdictBadge(msg.answer.verdict)}
                </div>

                {/* Quantitative Metric Callout if available */}
                {msg.answer?.metricValue && (
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300">
                      {msg.answer.metricValue}
                    </span>
                    {msg.answer.metricUnit && (
                      <span className="text-xs font-mono text-slate-400 uppercase">
                        {msg.answer.metricUnit}
                      </span>
                    )}
                  </div>
                )}

                {/* Verdict Reason Banner */}
                {msg.answer?.verdictReason && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed ${
                      msg.answer.verdict === 'ANSWERED'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : msg.answer.verdict === 'UNCERTAIN'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <span className="font-semibold uppercase tracking-wider text-[10px] mr-1">
                      VERDICT AUDIT:
                    </span>
                    {msg.answer.verdictReason}
                  </div>
                )}
              </div>

              {/* Structured Card Content: Evidence Image with Toggle & Breakdown */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Summary text */}
                <p className="text-sm text-slate-300 leading-relaxed">
                  {msg.text}
                </p>

                {/* Visual Evidence Viewer with "Boxes / Pixel-precise outlines" toggle */}
                {msg.answer && msg.answer.imageUrl && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Visual Evidence Layer
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Toggle boxes / outlines below
                      </span>
                    </div>

                    <EvidenceImageViewer
                      imageUrl={msg.answer.imageUrl}
                      imageAlt={msg.answer.imageAlt}
                      boxes={msg.answer.boxes}
                      polygons={msg.answer.polygons}
                      verdict={msg.answer.verdict}
                      confidenceScore={msg.answer.confidenceScore}
                    />
                  </div>
                )}

                {/* Category Feature Breakdown Tags */}
                {msg.answer?.categoryBreakdown && msg.answer.categoryBreakdown.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-mono text-slate-400 mr-1">
                      Detected Classes:
                    </span>
                    {msg.answer.categoryBreakdown.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800/80 border border-white/10 text-slate-200 flex items-center gap-1.5"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color || '#38bdf8' }}
                        />
                        {item.label}: <strong className="text-white">{item.count}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Collapsible Audit Trail */}
                {msg.answer?.auditTrail && msg.answer.auditTrail.length > 0 && (
                  <div className="mt-4 pt-2">
                    <AuditTrail
                      checks={msg.answer.auditTrail}
                      confidenceScore={msg.answer.confidenceScore}
                      verdict={msg.answer.verdict}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={threadEndRef} />
      </main>

      {/* BOTTOM PROMPT AREA (STICKY, GLASS-STYLE PANEL) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/85 backdrop-blur-2xl p-3 sm:p-4 transition-colors">
        <div className="max-w-4xl mx-auto">
          {/* Attached Files Preview Strip */}
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2.5 animate-in fade-in duration-150">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                Active Raster:
              </span>
              {attachedImages.map(img => (
                <div
                  key={img.id}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs shadow-md group"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-6 h-6 rounded-md object-cover border border-white/10"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-[11px] text-slate-200 truncate max-w-[160px]">
                      {img.name}
                    </span>
                    <span className="text-[9px] text-cyan-400 font-mono">
                      {img.format || 'GeoTIFF'} {img.size ? `• ${img.size}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    title="Remove image"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Box & Action Row */}
          <div
            onDragOver={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const objectUrl = URL.createObjectURL(file);
                  const isTiff = file.name.endsWith('.tif') || file.name.endsWith('.tiff');
                  handleAddImage({
                    id: `drop-${Date.now()}-${i}`,
                    name: file.name,
                    url: objectUrl,
                    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                    format: isTiff ? 'GeoTIFF' : file.type.includes('png') ? 'PNG' : 'JPG',
                    sensor: isTiff ? 'Raster Orthomosaic (GeoTIFF)' : 'High-Res Optical Capture',
                    gsd: isTiff ? 'Calibrated 0.3m' : 'Standard Optical'
                  });
                }
              }
            }}
            className="relative rounded-2xl border border-white/15 bg-slate-900/90 shadow-2xl focus-within:border-cyan-500/60 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all"
          >
            {/* Multi-line text input */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                mode === 'comparison'
                  ? 'Ask about the bi-temporal change (e.g. "What changed between these images?")...'
                  : 'Ask a question in plain English (e.g. "How many buildings are here?", "Where is the water?")...'
              }
              className="w-full px-4 pt-3 pb-12 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none min-h-[46px] max-h-[160px]"
            />

            {/* Bottom Input Controls Bar */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
              {/* Left: Attach menu (+ button) */}
              <div className="flex items-center gap-1.5">
                <AttachMenu
                  attachedImages={attachedImages}
                  onAddImage={handleAddImage}
                  onRemoveImage={handleRemoveImage}
                />

                <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                  PNG, JPG, GeoTIFF, Web, API
                </span>
              </div>

              {/* Right: Theme Selector & Send Button */}
              <div className="flex items-center gap-2">
                {/* Theme Selector directly in prompt area as requested: "Send button, plus, choose the corresponding color themes" */}
                <ThemeSelector compact />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => executeQuery(inputText)}
                  disabled={isSubmitting || (!inputText.trim() && attachedImages.length === 0)}
                  title="Send query (Enter)"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all flex items-center gap-1.5 active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Analyse</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-2">
            <span>Enter to send • Shift+Enter for new line</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" /> Evidence, not guesses.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
