import React, { useState, useEffect } from 'react';
import { AppMode } from '../types';
import { ThemeSelector } from './ThemeSelector';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentRoute]);

  // ==========================================
  // ON ABOUT PAGE ("/")
  // ==========================================
  if (currentRoute === '/') {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#02040A]/80 backdrop-blur-md border-b border-white/10 shadow-lg py-3'
            : 'bg-transparent border-b border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          {/* Left: Logo & Drishti Name */}
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 group text-left transition-transform active:scale-95"
            aria-label="Drishti Home"
          >
            {!logoError ? (
              <img
                src="/logo.png"
                alt="Drishti Logo"
                onError={() => setLogoError(true)}
                className="h-9 sm:h-10 w-auto object-contain rounded-[10px] transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-xs font-mono text-cyan-400">
                D
              </div>
            )}
            <span className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-white/95 group-hover:text-cyan-300 transition-colors">
              Drishti
            </span>
          </button>

          {/* Right: Small "Launch Studio" button */}
          <button
            type="button"
            onClick={() => onNavigate('/chat')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-[#22D3EE] hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all flex items-center gap-1.5 active:scale-95 group"
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
  // 56px, solid #05070F, no border until scrolled
  // ==========================================
  return (
    <header
      className={`sticky top-0 z-40 w-full h-14 bg-[#05070F] transition-colors ${
        isScrolled ? 'border-b border-[#151D33]' : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Left: Logo and name "Drishti" (V2.4 badge removed) */}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
          aria-label="Back to Drishti Home"
        >
          {!logoError ? (
            <img
              src="/logo.png"
              alt="Drishti Logo"
              onError={() => setLogoError(true)}
              className="h-8 sm:h-9 w-auto object-contain rounded-[10px] transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg border border-[#151D33] bg-[#0A0F1D] flex items-center justify-center text-xs font-mono text-[#22D3EE]">
              D
            </div>
          )}

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
