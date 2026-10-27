import React, { useState, useRef, useEffect } from 'react';
import {
  Message,
  AttachedImage,
  DrishtiAnswer,
  AppMode
} from '../types';
import { AssistantReply } from './AssistantReply';
import { drishtiEngine } from '../services/api';
import { dataService } from '../services/supabase';
import { Logo } from './Logo';
import { ApiKeyModal } from './ApiKeyModal';
import { UrlInputModal } from './UrlInputModal';
import { SAMPLE_IMAGES } from '../constants/sampleData';
import {
  Paperclip,
  Send,
  X,
  Menu,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Columns,
  Upload,
  Globe,
  Satellite,
  ArrowRight,
  Layers
} from 'lucide-react';

interface ChatPageProps {
  chatId: string;
  onToggleSidebarMobile: () => void;
  onNavigateAbout: () => void;
  onChatTitleUpdate?: (chatId: string, title: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  chatId,
  onToggleSidebarMobile,
  onNavigateAbout,
  onChatTitleUpdate
}) => {
  // Mode state: 'interactive' (1 image) or 'comparison' (2 images: Past & Present)
  const [mode, setMode] = useState<AppMode>('interactive');

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState<string>('');

  // Interactive Mode: 1 image
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);

  // Comparison Mode: 2 images (Past & Present)
  const [pastImage, setPastImage] = useState<AttachedImage | null>(null);
  const [presentImage, setPresentImage] = useState<AttachedImage | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorWarning, setErrorWarning] = useState<string | null>(null);

  // Modals & Popovers
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);
  const [modalTargetSlot, setModalTargetSlot] = useState<'interactive' | 'past' | 'new'>('interactive');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState<boolean>(false);

  // File Inputs
  const interactiveFileInputRef = useRef<HTMLInputElement>(null);
  const pastFileInputRef = useRef<HTMLInputElement>(null);
  const presentFileInputRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Close attach menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isAttachMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAttachMenuOpen]);

  // Load chat messages and draft on chatId change
  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        const stored = await dataService.getMessages(chatId);
        if (!isMounted) return;

        if (stored && stored.length > 0) {
          const mapped: Message[] = stored.map(m => ({
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'drishti',
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: m.content || '',
            answer: m.result as DrishtiAnswer | undefined,
            images: m.assets as any
          }));
          setMessages(mapped);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.warn('Failed to load messages:', err);
      }
    };

    loadMessages();

    // Restore draft
    const draft = localStorage.getItem(`drishti_draft_${chatId}`);
    setPrompt(draft || '');

    return () => {
      isMounted = false;
    };
  }, [chatId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPrompt(text);
    localStorage.setItem(`drishti_draft_${chatId}`, text);
    if (errorWarning) setErrorWarning(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  // Process a local file into an AttachedImage object
  const createAttachedImageFromFile = (file: File, type: 'single' | 'before' | 'after'): AttachedImage => {
    const isTiff = file.name.endsWith('.tif') || file.name.endsWith('.tiff');
    return {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      format: isTiff ? 'GeoTIFF' : file.type.includes('png') ? 'PNG' : 'JPG',
      sensor: isTiff ? 'Raster Orthomosaic (GeoTIFF)' : 'Optical Capture',
      type
    };
  };

  // Local file upload handlers
  const handleInteractiveFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedImage(createAttachedImageFromFile(file, 'single'));
    if (errorWarning) setErrorWarning(null);
    e.target.value = '';
    setIsAttachMenuOpen(false);
  };

  const handlePastFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPastImage(createAttachedImageFromFile(file, 'before'));
    if (errorWarning) setErrorWarning(null);
    e.target.value = '';
    setIsAttachMenuOpen(false);
  };

  const handlePresentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPresentImage(createAttachedImageFromFile(file, 'after'));
    if (errorWarning) setErrorWarning(null);
    e.target.value = '';
    setIsAttachMenuOpen(false);
  };

  // Drag and drop image
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (mode === 'interactive') {
      setAttachedImage(createAttachedImageFromFile(file, 'single'));
    } else {
      if (!pastImage) {
        setPastImage(createAttachedImageFromFile(file, 'before'));
      } else {
        setPresentImage(createAttachedImageFromFile(file, 'after'));
      }
    }
    if (errorWarning) setErrorWarning(null);
  };

  // Modal success handler (Web URL or Dataset API)
  const handleImageSourceSuccess = (img: AttachedImage, slot: 'interactive' | 'past' | 'new' = 'interactive') => {
    if (mode === 'interactive' || slot === 'interactive') {
      setAttachedImage(img);
    } else if (slot === 'past') {
      setPastImage(img);
    } else if (slot === 'new') {
      setPresentImage(img);
    }
    if (errorWarning) setErrorWarning(null);
  };

  // Execute Analysis
  const handleSend = async (
    customPrompt?: string,
    customInteractiveImage?: AttachedImage,
    customComparisonPair?: { before: AttachedImage; after: AttachedImage }
  ) => {
    const query = (customPrompt || prompt).trim();
    if (!query) return;

    setErrorWarning(null);

    // Determine payload based on mode
    let targetImages: AttachedImage[] = [];
    let compPair: { before: AttachedImage; after: AttachedImage } | undefined = undefined;

    if (mode === 'interactive') {
      let targetImg = customInteractiveImage || attachedImage;
      if (!targetImg && messages.length === 0) {
        if (query.toLowerCase().includes('water')) {
          targetImg = SAMPLE_IMAGES.water;
        } else {
          targetImg = SAMPLE_IMAGES.urban;
        }
        setAttachedImage(targetImg);
      }
      if (targetImg) {
        targetImages = [targetImg];
      }
    } else {
      // Comparison Mode: Needs Past & Present
      let pImg = customComparisonPair?.before || pastImage;
      let prImg = customComparisonPair?.after || presentImage;

      if ((!pImg || !prImg) && messages.length === 0) {
        if (query.toLowerCase().includes('flood')) {
          pImg = SAMPLE_IMAGES.floodBefore;
          prImg = SAMPLE_IMAGES.floodAfter;
        } else {
          pImg = SAMPLE_IMAGES.forestBefore;
          prImg = SAMPLE_IMAGES.forestAfter;
        }
        setPastImage(pImg);
        setPresentImage(prImg);
      }

      if (pImg && prImg) {
        targetImages = [pImg, prImg];
        compPair = { before: pImg, after: prImg };
      } else {
        setErrorWarning('Please attach both a Past image and a Present image for temporal comparison.');
        return;
      }
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `usr-${Date.now()}`;

    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      timestamp,
      text: query,
      images: targetImages,
      mode,
      comparisonPair: compPair
    };

    const drishtiMsgId = `dri-${Date.now()}`;
    const loadingMessage: Message = {
      id: drishtiMsgId,
      sender: 'drishti',
      timestamp,
      text: mode === 'comparison' ? 'Performing bi-temporal coregistration...' : 'Analysing satellite pixels...',
      isLoading: true,
      loadingStep: mode === 'comparison' ? 'Aligning sensor tie-points & radiometry...' : 'Ingesting multi-spectral bands...'
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setPrompt('');
    localStorage.removeItem(`drishti_draft_${chatId}`);
    setIsLoading(true);
    setLoadingStep(mode === 'comparison' ? 'Aligning sensor tie-points & radiometry...' : 'Ingesting multi-spectral bands...');

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Persist user message
    dataService.createMessage(chatId, {
      role: 'user',
      text: query,
      images: targetImages
    }).catch(console.warn);

    try {
      const finalAnswer = await drishtiEngine.analyze(
        {
          prompt: query,
          mode,
          images: targetImages,
          comparisonPair: compPair
        },
        step => {
          setLoadingStep(step);
          setMessages(prev =>
            prev.map(m => (m.id === drishtiMsgId ? { ...m, loadingStep: step } : m))
          );
        }
      );

      // Ensure the displayed image matches the user's uploaded image
      if (targetImages.length > 0 && targetImages[0].url) {
        if (!finalAnswer.imageUrl || finalAnswer.imageUrl.includes('urban-satellite') || targetImages[0].file) {
          finalAnswer.imageUrl = targetImages[targetImages.length - 1].url;
        }
      }

      // Persist assistant message
      dataService.createMessage(chatId, {
        role: 'assistant',
        text: finalAnswer.summary,
        result: finalAnswer
      }).catch(console.warn);

      // Auto-title chat from the first question
      const friendlyTitle = query.length > 36 ? `${query.substring(0, 34)}...` : query;
      dataService.updateChat(chatId, {
        title: friendlyTitle,
        last_question: query,
        last_verdict: finalAnswer.verdict,
        last_message_at: new Date().toISOString()
      }).catch(console.warn);

      if (onChatTitleUpdate) {
        onChatTitleUpdate(chatId, friendlyTitle);
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === drishtiMsgId
            ? {
                ...m,
                isLoading: false,
                loadingStep: undefined,
                text: finalAnswer.summary,
                answer: finalAnswer,
                comparisonPair: compPair
              }
            : m
        )
      );
    } catch (err) {
      console.error('Analysis error:', err);
      setMessages(prev =>
        prev.map(m =>
          m.id === drishtiMsgId
            ? {
                ...m,
                isLoading: false,
                text: 'Analysis could not be completed. Please verify raster parameters and try again.'
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) handleSend();
    }
  };

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full bg-[#151922] text-[#E8ECF4] relative overflow-hidden"
    >
      {/* Hidden File Pickers */}
      <input
        type="file"
        ref={interactiveFileInputRef}
        onChange={handleInteractiveFileUpload}
        accept="image/png, image/jpeg, image/tiff, .tif, .tiff"
        className="hidden"
      />
      <input
        type="file"
        ref={pastFileInputRef}
        onChange={handlePastFileUpload}
        accept="image/png, image/jpeg, image/tiff, .tif, .tiff"
        className="hidden"
      />
      <input
        type="file"
        ref={presentFileInputRef}
        onChange={handlePresentFileUpload}
        accept="image/png, image/jpeg, image/tiff, .tif, .tiff"
        className="hidden"
      />

      {/* ===================================================================
          TOP HEADER: Mode Switcher (Top Right) + Drishti Logo (Back to About)
          =================================================================== */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#0F1218] border-b border-[#262C3A] shrink-0 z-30">
        {/* Left: Mobile hamburger menu (<768px) + Mode Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebarMobile}
            className="md:hidden p-1.5 rounded-lg text-[#9AA3B5] hover:text-[#E8ECF4] hover:bg-[#1C212C] transition-colors"
            aria-label="Open chat history"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B7385]">
              Mode:
            </span>
            <span className="text-xs font-mono font-medium text-[#22D3EE]">
              {mode === 'interactive' ? 'Single-Image Analysis' : 'Dual-Image Comparison'}
            </span>
          </div>
        </div>

        {/* Right: Mode Switcher + Drishti Logo (Link to About) */}
        <div className="flex items-center gap-3">
          {/* Two Modes Switcher Pill */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#1C212C] border border-[#262C3A]">
            <button
              type="button"
              onClick={() => {
                setMode('interactive');
                setErrorWarning(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                mode === 'interactive'
                  ? 'bg-[#22D3EE] text-[#0B0D12] font-semibold shadow-sm'
                  : 'text-[#9AA3B5] hover:text-[#E8ECF4]'
              }`}
              title="Interactive mode: Analyze one image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Interactive</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('comparison');
                setErrorWarning(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                mode === 'comparison'
                  ? 'bg-[#22D3EE] text-[#0B0D12] font-semibold shadow-sm'
                  : 'text-[#9AA3B5] hover:text-[#E8ECF4]'
              }`}
              title="Comparison mode: Compare past vs present images"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Comparison</span>
            </button>
          </div>

          {/* Drishti Logo on Top Right -> Takes back to About page */}
          <button
            type="button"
            onClick={onNavigateAbout}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#1C212C] border border-transparent hover:border-[#262C3A] text-left transition-all duration-150 group cursor-pointer"
            title="Return to Drishti Overview (/)"
          >
            <Logo size={24} />
            <span className="hidden sm:inline font-heading font-semibold text-sm text-[#E8ECF4] group-hover:text-[#22D3EE] transition-colors">
              Drishti
            </span>
          </button>
        </div>
      </header>

      {/* Main Chat Panel (Solid #151922 surface, no background image or blur) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-[760px] mx-auto w-full">
          {/* ===================================================================
              EMPTY STATE (New Chat)
              =================================================================== */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[58vh] text-center space-y-6 pt-4">
              <Logo size={48} />

              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-[#E8ECF4] tracking-tight">
                  {mode === 'interactive'
                    ? 'What should Drishti look at?'
                    : 'Compare Temporal Satellite Imagery'}
                </h1>
                <p className="text-sm text-[#9AA3B5] mt-1.5 max-w-lg">
                  {mode === 'interactive'
                    ? 'Attach one optical, SAR, or multi-spectral raster from device, web URL, or satellite API.'
                    : 'Analyze differences between a past baseline image and a present image from device, web URL, or satellite API.'}
                </p>
              </div>

              {/* MODE 1: INTERACTIVE IMAGE SOURCING PANEL */}
              {mode === 'interactive' ? (
                <div className="w-full max-w-md p-4 rounded-2xl bg-[#1C212C] border border-[#262C3A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#6B7385]">
                      Active Image Slot
                    </span>
                    {attachedImage && (
                      <span className="text-[11px] font-mono text-[#34D399] flex items-center gap-1">
                        ● Ready
                      </span>
                    )}
                  </div>

                  {attachedImage ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#151922] border border-[#262C3A]">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={attachedImage.url}
                          alt={attachedImage.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#262C3A] shrink-0"
                        />
                        <div className="text-left truncate">
                          <div className="text-xs font-mono text-[#E8ECF4] truncate font-medium">
                            {attachedImage.name}
                          </div>
                          <div className="text-[10px] text-[#6B7385] font-mono">
                            {attachedImage.format || 'Raster'} • {attachedImage.sensor || attachedImage.size || 'Optical'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedImage(null)}
                        className="p-1.5 rounded-lg text-[#9AA3B5] hover:text-[#F87171] hover:bg-[#1C212C] transition-colors"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => interactiveFileInputRef.current?.click()}
                        className="p-3 rounded-xl bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] hover:border-[#22D3EE]/40 flex flex-col items-center gap-1.5 text-[#E8ECF4] transition-all group active:scale-95"
                      >
                        <Upload className="w-4 h-4 text-[#22D3EE] group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">Device</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setModalTargetSlot('interactive');
                          setIsUrlModalOpen(true);
                        }}
                        className="p-3 rounded-xl bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] hover:border-[#22D3EE]/40 flex flex-col items-center gap-1.5 text-[#E8ECF4] transition-all group active:scale-95"
                      >
                        <Globe className="w-4 h-4 text-[#22D3EE] group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">Web URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setModalTargetSlot('interactive');
                          setIsApiKeyModalOpen(true);
                        }}
                        className="p-3 rounded-xl bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] hover:border-[#22D3EE]/40 flex flex-col items-center gap-1.5 text-[#E8ECF4] transition-all group active:scale-95"
                      >
                        <Satellite className="w-4 h-4 text-[#22D3EE] group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">Dataset API</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* MODE 2: COMPARISON DUAL-IMAGE SLOTS PANEL */
                <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Slot 1: Past Image */}
                  <div className="p-4 rounded-2xl bg-[#1C212C] border border-[#262C3A] space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#9AA3B5] font-semibold">
                        1. Past Image
                      </span>
                      {pastImage && (
                        <span className="text-[10px] font-mono text-[#34D399]">Attached</span>
                      )}
                    </div>

                    {pastImage ? (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#151922] border border-[#262C3A]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={pastImage.url}
                            alt={pastImage.name}
                            className="w-9 h-9 rounded object-cover border border-[#262C3A] shrink-0"
                          />
                          <div className="truncate">
                            <div className="text-xs font-mono text-[#E8ECF4] truncate">
                              {pastImage.name}
                            </div>
                            <div className="text-[10px] text-[#6B7385] font-mono">
                              {pastImage.format || 'Raster'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPastImage(null)}
                          className="p-1 rounded text-[#9AA3B5] hover:text-[#F87171]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => pastFileInputRef.current?.click()}
                          className="p-2 rounded-lg bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] flex flex-col items-center gap-1 text-[#E8ECF4] transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span className="text-[10px]">Device</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalTargetSlot('past');
                            setIsUrlModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] flex flex-col items-center gap-1 text-[#E8ECF4] transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span className="text-[10px]">URL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalTargetSlot('past');
                            setIsApiKeyModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] flex flex-col items-center gap-1 text-[#E8ECF4] transition-colors"
                        >
                          <Satellite className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span className="text-[10px]">API</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Slot 2: Present Image */}
                  <div className="p-4 rounded-2xl bg-[#1C212C] border border-[#262C3A] space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#9AA3B5] font-semibold">
                        2. Present Image
                      </span>
                      {presentImage && (
                        <span className="text-[10px] font-mono text-[#34D399]">Attached</span>
                      )}
                    </div>

                    {presentImage ? (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#151922] border border-[#262C3A]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={presentImage.url}
                            alt={presentImage.name}
                            className="w-9 h-9 rounded object-cover border border-[#262C3A] shrink-0"
                          />
                          <div className="truncate">
                            <div className="text-xs font-mono text-[#E8ECF4] truncate">
                              {presentImage.name}
                            </div>
                            <div className="text-[10px] text-[#6B7385] font-mono">
                              {presentImage.format || 'Raster'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPresentImage(null)}
                          className="p-1 rounded text-[#9AA3B5] hover:text-[#F87171]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => presentFileInputRef.current?.click()}
                          className="p-2 rounded-lg bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] flex flex-col items-center gap-1 text-[#E8ECF4] transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span className="text-[10px]">Device</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalTargetSlot('new');
                            setIsUrlModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] flex flex-col items-center gap-1 text-[#E8ECF4] transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span className="text-[10px]">URL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalTargetSlot('new');
                            setIsApiKeyModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-[#151922] hover:bg-[#262C3A] border border-[#262C3A] flex flex-col items-center gap-1 text-[#E8ECF4] transition-colors"
                        >
                          <Satellite className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span className="text-[10px]">API</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Clickable Suggestion Chips */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 pt-2 max-w-xl">
                {mode === 'interactive' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleSend('How many buildings are in this image?', SAMPLE_IMAGES.urban);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1C212C] hover:bg-[#262C3A] border border-[#262C3A] text-xs font-medium text-[#E8ECF4] transition-colors flex items-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>How many buildings are in this image?</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSend('Where is the water?', SAMPLE_IMAGES.water);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1C212C] hover:bg-[#262C3A] border border-[#262C3A] text-xs font-medium text-[#E8ECF4] transition-colors flex items-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Where is the water?</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSend('Inspect optical raster features', SAMPLE_IMAGES.urban);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1C212C] hover:bg-[#262C3A] border border-[#262C3A] text-xs font-medium text-[#E8ECF4] transition-colors flex items-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Inspect optical raster features</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleSend('What changed between these two images?', undefined, {
                          before: SAMPLE_IMAGES.forestBefore,
                          after: SAMPLE_IMAGES.forestAfter
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1C212C] hover:bg-[#262C3A] border border-[#262C3A] text-xs font-medium text-[#E8ECF4] transition-colors flex items-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>What changed between these two images?</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSend('Calculate flood inundation change', undefined, {
                          before: SAMPLE_IMAGES.floodBefore,
                          after: SAMPLE_IMAGES.floodAfter
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1C212C] hover:bg-[#262C3A] border border-[#262C3A] text-xs font-medium text-[#E8ECF4] transition-colors flex items-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Calculate flood inundation change</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSend('Measure forest canopy depletion', undefined, {
                          before: SAMPLE_IMAGES.forestBefore,
                          after: SAMPLE_IMAGES.forestAfter
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1C212C] hover:bg-[#262C3A] border border-[#262C3A] text-xs font-medium text-[#E8ECF4] transition-colors flex items-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Measure forest canopy depletion</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ===================================================================
               MESSAGE STREAM
               =================================================================== */
            <div className="space-y-6 pb-32">
              {messages.map(msg => {
                const isUser = msg.sender === 'user';

                // User Message: Right-aligned bubble in #1C212C
                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-xl bg-[#1C212C] border border-[#262C3A] rounded-2xl p-4 shadow-sm space-y-2.5">
                        <p className="text-[15px] leading-relaxed text-[#E8ECF4] whitespace-pre-wrap">
                          {msg.text}
                        </p>

                        {/* Attached Image Thumbnails */}
                        {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-[#262C3A]">
                            {msg.images.map((img, i) => (
                              <div
                                key={img.id || i}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0B0D12] border border-[#262C3A] text-xs"
                              >
                                <img
                                  src={img.url}
                                  alt={img.name}
                                  className="w-8 h-8 rounded object-cover border border-[#262C3A]"
                                />
                                <div className="min-w-0 pr-1 text-left">
                                  <div className="text-[11px] font-mono text-[#E8ECF4] truncate max-w-[140px] flex items-center gap-1.5">
                                    {msg.mode === 'comparison' && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#22D3EE]/20 text-[#22D3EE] font-semibold">
                                        {i === 0 ? 'PAST' : 'PRESENT'}
                                      </span>
                                    )}
                                    <span>{img.name}</span>
                                  </div>
                                  <div className="text-[9px] text-[#6B7385] font-mono">
                                    {img.format || 'Raster'} • {img.size || 'Attached'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-[10px] text-[#6B7385] font-mono text-right">
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Assistant Loading State
                if (msg.isLoading) {
                  return (
                    <div key={msg.id} className="flex items-start gap-3 py-3">
                      <Logo size={24} />
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 text-sm text-[#E8ECF4]">
                          <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
                          <span className="font-medium">{msg.text || 'Analysing satellite pixels...'}</span>
                        </div>
                        <p className="text-xs font-mono text-[#9AA3B5]">
                          {msg.loadingStep || loadingStep || 'Extracting spatial features...'}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Assistant Document Reply (No box, flowing document)
                if (msg.answer) {
                  return (
                    <div key={msg.id} className="py-2">
                      <AssistantReply
                        answer={msg.answer}
                        timestamp={msg.timestamp}
                        comparisonPair={msg.comparisonPair}
                        onRerun={() => {
                          if (msg.answer) handleSend(msg.answer.headline);
                        }}
                      />
                    </div>
                  );
                }

                // Plain Text Assistant Reply
                return (
                  <div key={msg.id} className="flex items-start gap-3 py-2">
                    <Logo size={24} />
                    <div className="flex-1 space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#E8ECF4]">Drishti</span>
                        <span className="text-[10px] font-mono text-[#6B7385]">{msg.timestamp}</span>
                      </div>
                      <p className="text-[16px] leading-[1.65] text-[#E8ECF4] whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================
          INPUT BAR (Sticky at bottom, solid #1C212C, 14px radius, 1px border)
          =================================================================== */}
      <div className="sticky bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-2 bg-gradient-to-t from-[#151922] via-[#151922] to-transparent">
        <div className="max-w-[760px] mx-auto w-full space-y-2">
          {/* Inline warning notification */}
          {errorWarning && (
            <div className="px-3.5 py-1.5 rounded-xl bg-[#1C212C] border border-[#FBBF24]/40 text-xs font-mono text-[#FBBF24] flex items-center gap-2 shadow-sm animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorWarning}</span>
            </div>
          )}

          {/* Attached Images Chips Preview */}
          {mode === 'interactive' && attachedImage && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C212C] border border-[#262C3A] w-fit text-xs animate-in fade-in">
              <img
                src={attachedImage.url}
                alt={attachedImage.name}
                className="w-5 h-5 rounded object-cover border border-[#262C3A]"
              />
              <span className="font-mono text-[#E8ECF4] text-xs truncate max-w-[180px]">
                {attachedImage.name}
              </span>
              <span className="text-[10px] font-mono text-[#6B7385]">
                {attachedImage.size || attachedImage.format}
              </span>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-0.5 rounded text-[#9AA3B5] hover:text-[#F87171] ml-1 transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Comparison Mode: Both Past and Present preview chips */}
          {mode === 'comparison' && (pastImage || presentImage) && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in">
              {pastImage && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C212C] border border-[#262C3A] text-xs">
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#22D3EE]/20 text-[#22D3EE] font-bold">
                    PAST
                  </span>
                  <img
                    src={pastImage.url}
                    alt={pastImage.name}
                    className="w-4 h-4 rounded object-cover"
                  />
                  <span className="font-mono text-[#E8ECF4] text-xs truncate max-w-[130px]">
                    {pastImage.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPastImage(null)}
                    className="p-0.5 rounded text-[#9AA3B5] hover:text-[#F87171]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {presentImage && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C212C] border border-[#262C3A] text-xs">
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#34D399]/20 text-[#34D399] font-bold">
                    PRESENT
                  </span>
                  <img
                    src={presentImage.url}
                    alt={presentImage.name}
                    className="w-4 h-4 rounded object-cover"
                  />
                  <span className="font-mono text-[#E8ECF4] text-xs truncate max-w-[130px]">
                    {presentImage.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPresentImage(null)}
                    className="p-0.5 rounded text-[#9AA3B5] hover:text-[#F87171]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input Bar Container */}
          <div className="relative rounded-[14px] bg-[#1C212C] border border-[#262C3A] focus-within:border-[#22D3EE] focus-within:ring-1 focus-within:ring-[#22D3EE] transition-all p-2 flex items-end gap-2 shadow-lg">
            {/* Paperclip Button with Sourcing Popover Menu */}
            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setIsAttachMenuOpen(v => !v)}
                title="Attach satellite image (Device, Web URL, Dataset API)"
                className="h-9 w-9 rounded-lg hover:bg-[#262C3A] text-[#9AA3B5] hover:text-[#E8ECF4] flex items-center justify-center shrink-0 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Attach Dropdown Menu */}
              {isAttachMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#0F1218] border border-[#262C3A] rounded-xl shadow-2xl p-2 z-40 text-left animate-in fade-in duration-100">
                  {mode === 'interactive' ? (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#6B7385]">
                        Attach Image From
                      </div>
                      <button
                        type="button"
                        onClick={() => interactiveFileInputRef.current?.click()}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#E8ECF4] hover:bg-[#1C212C] transition-colors"
                      >
                        <Upload className="w-4 h-4 text-[#22D3EE]" />
                        <span>Upload from Device</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalTargetSlot('interactive');
                          setIsUrlModalOpen(true);
                          setIsAttachMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#E8ECF4] hover:bg-[#1C212C] transition-colors"
                      >
                        <Globe className="w-4 h-4 text-[#22D3EE]" />
                        <span>Paste Web Image URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalTargetSlot('interactive');
                          setIsApiKeyModalOpen(true);
                          setIsAttachMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#E8ECF4] hover:bg-[#1C212C] transition-colors"
                      >
                        <Satellite className="w-4 h-4 text-[#22D3EE]" />
                        <span>Connect Dataset API</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Slot 1: Past */}
                      <div className="space-y-0.5">
                        <div className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#22D3EE] font-bold">
                          1. Past Image
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => pastFileInputRef.current?.click()}
                            className="p-1.5 rounded-lg bg-[#151922] hover:bg-[#1C212C] text-[10px] text-center text-[#E8ECF4]"
                          >
                            Device
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalTargetSlot('past');
                              setIsUrlModalOpen(true);
                              setIsAttachMenuOpen(false);
                            }}
                            className="p-1.5 rounded-lg bg-[#151922] hover:bg-[#1C212C] text-[10px] text-center text-[#E8ECF4]"
                          >
                            URL
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalTargetSlot('past');
                              setIsApiKeyModalOpen(true);
                              setIsAttachMenuOpen(false);
                            }}
                            className="p-1.5 rounded-lg bg-[#151922] hover:bg-[#1C212C] text-[10px] text-center text-[#E8ECF4]"
                          >
                            API
                          </button>
                        </div>
                      </div>

                      {/* Slot 2: Present */}
                      <div className="space-y-0.5 pt-1 border-t border-[#262C3A]">
                        <div className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#34D399] font-bold">
                          2. Present Image
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => presentFileInputRef.current?.click()}
                            className="p-1.5 rounded-lg bg-[#151922] hover:bg-[#1C212C] text-[10px] text-center text-[#E8ECF4]"
                          >
                            Device
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalTargetSlot('new');
                              setIsUrlModalOpen(true);
                              setIsAttachMenuOpen(false);
                            }}
                            className="p-1.5 rounded-lg bg-[#151922] hover:bg-[#1C212C] text-[10px] text-center text-[#E8ECF4]"
                          >
                            URL
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalTargetSlot('new');
                              setIsApiKeyModalOpen(true);
                              setIsAttachMenuOpen(false);
                            }}
                            className="p-1.5 rounded-lg bg-[#151922] hover:bg-[#1C212C] text-[10px] text-center text-[#E8ECF4]"
                          >
                            API
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Textarea: auto-growing */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'interactive'
                  ? 'Ask Drishti about this image…'
                  : 'Ask Drishti what changed between past and present images…'
              }
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none text-[15px] text-[#E8ECF4] placeholder-[#6B7385] focus:outline-none focus:ring-0 py-1.5 px-1 max-h-36 leading-relaxed"
            />

            {/* Send Button in Spark #22D3EE */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={
                (!prompt.trim() && !attachedImage && (!pastImage || !presentImage)) || isLoading
              }
              className="h-9 w-9 rounded-lg bg-[#22D3EE] hover:bg-[#67E8F9] text-[#0B0D12] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all font-semibold active:scale-95 shadow-sm"
              title="Send question to Drishti engine"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* One-line muted disclaimer */}
          <p className="text-[11px] font-sans text-center text-[#6B7385]">
            Drishti flags, it does not judge. Verify findings before acting.
          </p>
        </div>
      </div>

      {/* Sourcing Modal 1: Web URL */}
      <UrlInputModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        mode={mode}
        defaultSlot={modalTargetSlot}
        onSubmitUrl={handleImageSourceSuccess}
      />

      {/* Sourcing Modal 2: Satellite Dataset API */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        mode={mode}
        defaultSlot={modalTargetSlot}
        onConnectSuccess={handleImageSourceSuccess}
      />
    </div>
  );
};
