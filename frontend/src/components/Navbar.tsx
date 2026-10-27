import React, { useState, useEffect } from 'react';
import { AppMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeSelector } from './ThemeSelector';
import { SplitSquareVertical, MessageSquareText, ArrowRight } from 'lucide-react';

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
  const { themeConfig } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (currentRoute !== '/') {
      setIsScrolled(true);
      return;
    }
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentRoute]);

  // ON ABOUT PAGE: Transparent at top, thin blurred glass bar after ~40px scroll
  if (currentRoute === '/') {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#02040A]/75 backdrop-blur-md border-b border-white/10 shadow-lg py-3'
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
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              /* TODO: Add logo at /public/logo.png or /public/logo.svg */
              <div className="h-9 w-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-xs font-mono text-cyan-400">
                D
              </div>
            )}
            <span className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-white/95 group-hover:text-cyan-300 transition-colors">
              Drishti
            </span>
          </button>

          {/* Right: Small "Launch Studio" button (No /chat chip, no version, no palette toggle) */}
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

  // ON CHAT PAGE: Preserved untouched functionality for /chat
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo -> Links back to About */}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
        >
          {!logoError ? (
            <img
              src="/logo.png"
              alt="Drishti Logo"
              onError={() => setLogoError(true)}
              className="h-9 w-auto object-contain"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-xs font-mono text-cyan-400">
              D
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Drishti
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest hidden sm:inline-block">
                v2.4
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 -mt-1 hidden xs:block">
              Evidence, not guesses.
            </div>
          </div>
        </button>

        {/* Center: Segmented Mode Switcher (Visible on Chat page) */}
        {onModeChange && (
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-inner relative">
            <button
              type="button"
              onClick={() => onModeChange('interactive')}
              className={`relative flex items-center gap-2 px-3.5 sm:px-5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 z-10 ${
                mode === 'interactive'
                  ? 'text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquareText
                className="w-3.5 h-3.5"
                style={{ color: mode === 'interactive' ? themeConfig.primaryHex : undefined }}
              />
              <span>Interactive</span>
              {mode === 'interactive' && (
                <span
                  className="absolute inset-0 rounded-lg -z-10 shadow-sm border border-white/10"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderColor: themeConfig.primaryHex
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => onModeChange('comparison')}
              className={`relative flex items-center gap-2 px-3.5 sm:px-5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 z-10 ${
                mode === 'comparison'
                  ? 'text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareVertical
                className="w-3.5 h-3.5"
                style={{ color: mode === 'comparison' ? themeConfig.primaryHex : undefined }}
              />
              <span>Comparison</span>
              {mode === 'comparison' && (
                <span
                  className="absolute inset-0 rounded-lg -z-10 shadow-sm border border-white/10"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderColor: themeConfig.primaryHex
                  }}
                />
              )}
            </button>
          </div>
        )}

        {/* Right side controls on Chat page */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-white/10 transition-colors"
          >
            About Drishti
          </button>
          <ThemeSelector compact />
        </div>
      </div>
    </header>
  );
};
