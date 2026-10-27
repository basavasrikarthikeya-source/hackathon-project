import React, { useState, useEffect, useRef } from 'react';
import { Project, Chat, AppMode } from '../types';
import { Logo } from './Logo';
import {
  SplitSquareVertical,
  Crosshair,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Printer,
  Compass,
  Check,
  ChevronRight,
  Menu
} from 'lucide-react';

interface TopBarProps {
  currentProject: Project | null;
  currentChat: Chat | null;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onNavigateProjects: () => void;
  onNavigateAbout: () => void;
  onRenameChat: (newTitle: string) => void;
  onDeleteChat: () => void;
  onDuplicateChat: () => void;
  onExportPdf: () => void;
  onToggleMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentProject,
  currentChat,
  mode,
  onModeChange,
  onNavigateProjects,
  onNavigateAbout,
  onRenameChat,
  onDeleteChat,
  onDuplicateChat,
  onExportPdf,
  onToggleMobileSidebar
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Monitor scroll offset: after 24px, gentle top fade linear-gradient(rgba(4,6,16,0.7), rgba(4,6,16,0))
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleStartRename = () => {
    setEditedTitle(currentChat?.title || '');
    setIsEditingTitle(true);
    setIsMenuOpen(false);
  };

  const handleSaveRename = () => {
    if (editedTitle.trim() && currentChat) {
      onRenameChat(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header
      className={`sticky top-0 z-30 w-full transition-all duration-300 select-none ${
        isScrolled ? 'topbar-scrim backdrop-blur-xs' : 'bg-transparent'
      }`}
      style={{
        borderBottom: 'none', // Hard rule: no border
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Drawer Trigger + Logo + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-[#8793B3] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a
            href="/projects"
            onClick={(e) => {
              e.preventDefault();
              onNavigateProjects();
            }}
            className="flex items-center gap-3.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070F] p-1 -m-1 shrink-0"
            aria-label="Drishti Projects"
          >
            <Logo variant="chat" />
            <span className="font-heading font-semibold text-lg text-[#E8EEFC] group-hover:text-[#22D3EE] transition-colors leading-none whitespace-nowrap hidden sm:inline">
              Drishti
            </span>
          </a>

          <span className="text-[#8793B3]/40 hidden sm:inline select-none shrink-0">/</span>

          {/* Breadcrumb: "Project / Chat Title" (Editable) */}
          <nav className="flex items-center gap-1.5 text-xs font-mono min-w-0" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={onNavigateProjects}
              className="text-[#8793B3] hover:text-[#F2F6FF] transition-colors truncate max-w-[140px] sm:max-w-[200px]"
            >
              {currentProject?.name || 'Projects'}
            </button>
            <ChevronRight className="w-3 h-3 text-[#8793B3] shrink-0" />

            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="bg-black/60 text-[#F2F6FF] font-sans font-medium px-2 py-0.5 rounded border border-[#22D3EE] focus:outline-none text-xs w-48 sm:w-64"
              />
            ) : (
              <span
                onDoubleClick={handleStartRename}
                title="Double click to rename inspection"
                className="text-[#F2F6FF] font-sans font-medium truncate max-w-[180px] sm:max-w-[320px] cursor-pointer hover:underline decoration-cyan-500/50"
              >
                {currentChat?.title || 'Inspection'}
              </span>
            )}
          </nav>
        </div>

        {/* Right Controls: Mode Switcher, About link, '...' Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Switcher: Interactive vs Comparison (stored PER CHAT) */}
          <div
            className="flex items-center p-0.5 rounded-[10px] border border-[rgba(255,255,255,0.10)]"
            style={{ background: 'rgba(8, 12, 26, 0.86)' }}
          >
            <button
              type="button"
              onClick={() => onModeChange('interactive')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-medium transition-all ${
                mode === 'interactive'
                  ? 'bg-[rgba(34,211,238,0.16)] text-[#22D3EE]'
                  : 'text-[#8793B3] hover:text-[#F2F6FF]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Interactive</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('comparison')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-medium transition-all ${
                mode === 'comparison'
                  ? 'bg-[rgba(34,211,238,0.16)] text-[#22D3EE]'
                  : 'text-[#8793B3] hover:text-[#F2F6FF]'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Comparison</span>
            </button>
          </div>

          {/* About Drishti Link */}
          <button
            type="button"
            onClick={onNavigateAbout}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs text-[#8793B3] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>About</span>
          </button>

          {/* 3-dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(v => !v)}
              className="p-1.5 rounded-[10px] text-[#8793B3] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              aria-label="More chat actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-[12px] border border-[rgba(255,255,255,0.12)] p-1 text-xs shadow-2xl space-y-0.5 animate-in fade-in zoom-in-95"
                style={{ background: 'rgba(8, 12, 26, 0.96)' }}
              >
                <button
                  type="button"
                  onClick={handleStartRename}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[#F2F6FF] text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#8793B3]" />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDuplicateChat();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[#F2F6FF] text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-[#8793B3]" />
                  <span>Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportPdf();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[#F2F6FF] text-left"
                >
                  <Printer className="w-3.5 h-3.5 text-[#8793B3]" />
                  <span>Print / Export PDF</span>
                </button>
                <div className="h-[1px] bg-[rgba(255,255,255,0.08)] my-0.5" />
                <button
                  type="button"
                  onClick={() => {
                    onDeleteChat();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.15)] text-[#F87171] text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
