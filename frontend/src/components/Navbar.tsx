import React from 'react';
import { AppMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeSelector } from './ThemeSelector';
import { Eye, SplitSquareVertical, MessageSquareText, ShieldCheck } from 'lucide-react';

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo -> Links back to About */}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
        >
          {/* Logo Icon */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:border-cyan-400 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Eye className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            {/* Orbital ring accent */}
            <div className="absolute -inset-1 border border-cyan-400/20 rounded-xl pointer-events-none animate-pulse-slow" />
          </div>

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
        {currentRoute === '/chat' && onModeChange && (
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

        {/* Right side controls: Navigation, Theme Selector */}
        <div className="flex items-center gap-2.5">
          {currentRoute === '/' ? (
            <button
              type="button"
              onClick={() => onNavigate('/chat')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all flex items-center gap-2 active:scale-95"
            >
              <span>Launch Studio</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/20 text-slate-950">
                /chat
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-white/10 transition-colors"
            >
              About Drishti
            </button>
          )}

          <ThemeSelector compact />
        </div>
      </div>
    </header>
  );
};
