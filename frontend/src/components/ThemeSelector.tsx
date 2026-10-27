import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette, Check, Sparkles } from 'lucide-react';
import { ColorTheme } from '../types';

interface ThemeSelectorProps {
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ compact = false }) => {
  const { theme, setTheme, themeConfig, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        title="Switch color theme"
        className={`flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs transition-all ${
          compact ? 'p-2' : 'px-3 py-1.5'
        }`}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${themeConfig.dotClass}`} />
        {!compact && (
          <span className="font-mono text-[11px] font-medium hidden sm:inline">
            {themeConfig.name}
          </span>
        )}
        <Palette className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-56 sm:w-64 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Color Themes</span>
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </div>

          <div className="space-y-1 mt-1.5">
            {availableThemes.map(t => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id as ColorTheme);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left transition-all ${
                    isActive
                      ? 'bg-slate-800/90 border border-white/15 text-white'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: t.primaryHex, boxShadow: `0 0 10px ${t.primaryHex}66` }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{t.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{t.tagline}</div>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
