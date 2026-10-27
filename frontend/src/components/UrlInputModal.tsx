import React, { useState, useEffect } from 'react';
import { AttachedImage, AppMode } from '../types';
import { X, Globe, Link2, AlertCircle } from 'lucide-react';

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: AppMode;
  defaultSlot?: 'interactive' | 'past' | 'new';
  onSubmitUrl: (image: AttachedImage, targetSlot?: 'interactive' | 'past' | 'new') => void;
}

export const UrlInputModal: React.FC<UrlInputModalProps> = ({
  isOpen,
  onClose,
  mode = 'interactive',
  defaultSlot = mode === 'comparison' ? 'past' : 'interactive',
  onSubmitUrl
}) => {
  const [url, setUrl] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<'interactive' | 'past' | 'new'>(defaultSlot);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSlot(defaultSlot);
      setUrl('');
      setError(null);
    }
  }, [isOpen, defaultSlot]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a valid image URL');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Invalid URL format. Please include http:// or https://');
      return;
    }

    // Extract filename from URL
    const urlParts = trimmed.split('/');
    const rawFileName = urlParts[urlParts.length - 1]?.split('?')[0] || 'satellite-web-raster.jpg';
    const fileName = rawFileName.length > 32 ? `${rawFileName.substring(0, 30)}...` : rawFileName;

    const newImage: AttachedImage = {
      id: `url-${Date.now()}`,
      url: trimmed,
      name: fileName,
      format: 'Web URL',
      size: 'Remote Raster',
      sensor: 'Web HTTP / TMS Stream',
      type: selectedSlot === 'past' ? 'before' : selectedSlot === 'new' ? 'after' : 'single'
    };

    onSubmitUrl(newImage, selectedSlot);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0D12]/80 backdrop-blur-none animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#0F1218] border border-[#262C3A] rounded-2xl p-6 shadow-2xl flex flex-col text-[#E8ECF4] space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
              <Globe className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#E8ECF4]">
                Import Image from Web
              </h3>
              <p className="text-xs text-[#9AA3B5]">
                Provide an image URL or satellite tile raster URL.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9AA3B5] hover:text-[#E8ECF4] hover:bg-[#1C212C] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Slot Selector (in Comparison mode) */}
          {mode === 'comparison' && (
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6B7385] block">
                Target Slot
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#151922] border border-[#262C3A]">
                <button
                  type="button"
                  onClick={() => setSelectedSlot('past')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                    selectedSlot === 'past'
                      ? 'bg-[#22D3EE] text-[#0B0D12] font-semibold'
                      : 'text-[#9AA3B5] hover:text-[#E8ECF4]'
                  }`}
                >
                  Past Image Slot
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlot('new')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                    selectedSlot === 'new'
                      ? 'bg-[#22D3EE] text-[#0B0D12] font-semibold'
                      : 'text-[#9AA3B5] hover:text-[#E8ECF4]'
                  }`}
                >
                  Present Image Slot
                </button>
              </div>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6B7385] block">
              Image URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://example.com/satellite-ortho.jpg"
                autoFocus
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1C212C] border border-[#262C3A] text-sm text-[#E8ECF4] placeholder-[#6B7385] focus:outline-none focus:border-[#22D3EE] transition-colors"
              />
              <Link2 className="w-4 h-4 text-[#6B7385] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-[#F87171] font-mono pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#262C3A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#9AA3B5] hover:text-[#E8ECF4] hover:bg-[#1C212C] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#0B0D12] bg-[#22D3EE] hover:bg-[#67E8F9] transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              Attach from URL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
