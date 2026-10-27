import React from 'react';
import { AppMode } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { Logo } from './Logo';
import { ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentRoute: '/' | '/chat';
  onNavigate: (route: '/' | '/chat') => void;
  mode?: AppMode;
  onModeChange?: (mode: AppMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  mode = 'interactive',
  onModeChange
}) => {
  // ==========================================
  // ON ABOUT PAGE ("/")
  // Constant 64px box. No state flipping, no layout shifts.
  // The glass background opacity is driven continuously by --hp in the rAF loop.
  // ==========================================
  if (currentRoute === '/') {
    return (
      <header
        id="about-header"
        className="fixed top-0 left-0 right-0 z-50 w-full h-16 pointer-events-none"
      >
        {/* Continuous scroll-driven background glass layer */}
        <div className="about-header-glass" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4 pointer-events-auto">
          {/* Left: Logo (40px) & Drishti Name (Space Grotesk 600) */}
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 group text-left transition-transform active:scale-95"
            aria-label="Drishti Home"
          >
            <Logo size={40} priority="high" />
            <span className="font-heading font-semibold text-xl sm:text-2xl tracking-[-0.01em] text-white/95 group-hover:text-cyan-300 transition-colors drop-shadow-sm">
              Drishti
            </span>
          </button>

          {/* Right: Launch Studio button (exact same size and position at all scroll values) */}
          <button
            type="button"
            onClick={() => onNavigate('/chat')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-[#22D3EE] hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all flex items-center gap-1.5 active:scale-95 group shrink-0"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>
    );
  }

  // ==========================================
  // ON CHAT PAGE ("/chat")
  // 56px, solid #05070F, calm mission-control header
  // ==========================================
  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-[#05070F] border-b border-[#151D33] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Left: Logo (32px) and name "Drishti" */}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
          aria-label="Back to Drishti Home"
        >
          <Logo size={32} />
          <span className="font-heading font-semibold text-lg sm:text-xl text-[#E8EEFC] tracking-[-0.01em] group-hover:text-[#22D3EE] transition-colors">
            Drishti
          </span>
        </button>

        {/* Centre: Mode switcher compact segmented control */}
        {onModeChange && (
          <div className="relative flex items-center bg-[#0A0F1D] p-1 rounded-full border border-[#151D33]">
            {/* Sliding active indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-full bg-[rgba(34,211,238,0.12)] transition-all duration-200 ease-out pointer-events-none"
              style={{
                left: mode === 'interactive' ? '4px' : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)'
              }}
            />
            <button
              type="button"
              onClick={() => onModeChange('interactive')}
              className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                mode === 'interactive'
                  ? 'text-[#22D3EE] font-semibold'
                  : 'text-[#8A97B8] hover:text-[#E8EEFC]'
              }`}
            >
              Interactive
            </button>
            <button
              type="button"
              onClick={() => onModeChange('comparison')}
              className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                mode === 'comparison'
                  ? 'text-[#22D3EE] font-semibold'
                  : 'text-[#8A97B8] hover:text-[#E8EEFC]'
              }`}
            >
              Comparison
            </button>
          </div>
        )}

        {/* Right: "About Drishti" as plain text link + ONE theme control */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-xs sm:text-sm font-medium text-[#8A97B8] hover:text-[#E8EEFC] transition-colors"
          >
            About Drishti
          </button>
          <ThemeSelector compact />
        </div>
      </div>
    </header>
  );
};
