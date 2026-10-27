import React, { useState, useEffect } from 'react';
import { SAMPLE_PROVIDERS, SAMPLE_IMAGES } from '../constants/sampleData';
import { AttachedImage, AppMode } from '../types';
import { X, Satellite, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: AppMode;
  onConnectSuccess: (image: AttachedImage, targetSlot?: 'interactive' | 'past' | 'new') => void;
  defaultSlot?: 'interactive' | 'past' | 'new';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  mode = 'interactive',
  onConnectSuccess,
  defaultSlot = mode === 'comparison' ? 'past' : 'interactive'
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>(SAMPLE_PROVIDERS[0].id);
  const [selectedSlot, setSelectedSlot] = useState<'interactive' | 'past' | 'new'>(defaultSlot);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSlot(defaultSlot);
      setStatus('idle');
      setStatusMessage('');
      setApiKey('');
    }
  }, [isOpen, defaultSlot]);

  if (!isOpen) return null;

  const selectedProvider = SAMPLE_PROVIDERS.find(p => p.id === selectedProviderId) || SAMPLE_PROVIDERS[0];

  const handleConnect = () => {
    if (!apiKey.trim()) {
      setStatus('error');
      setStatusMessage('Please enter an API credential token.');
      return;
    }

    if (apiKey.toLowerCase().includes('fail') || apiKey.toLowerCase().includes('invalid')) {
      setStatus('error');
      setStatusMessage('Authentication failed (HTTP 401 Unauthorized): Invalid or revoked token.');
      return;
    }

    setStatus('testing');
    setStatusMessage('Authenticating TLS handshake and querying constellation catalog...');

    setTimeout(() => {
      setStatus('success');
      setStatusMessage(`Connected! Ingested Level-2A Orthomosaic from ${selectedProvider.name}.`);

      const providerImage: AttachedImage = {
        id: `api-${selectedProvider.id}-${Date.now()}`,
        name: `${selectedProvider.id.toUpperCase()}_Tile_2024_L2A.tif`,
        url: selectedSlot === 'past'
          ? SAMPLE_IMAGES.forestBefore.url
          : selectedSlot === 'new'
          ? SAMPLE_IMAGES.forestAfter.url
          : SAMPLE_IMAGES.urban.url,
        size: '22.8 MB (Cloud-Optimized GeoTIFF)',
        format: 'GeoTIFF',
        sensor: `${selectedProvider.name} (${selectedProvider.resolution})`,
        acquisitionDate: '2024-10-18 11:40 UTC',
        gsd: selectedProvider.resolution,
        type: selectedSlot === 'past' ? 'before' : selectedSlot === 'new' ? 'after' : 'single'
      };

      setTimeout(() => {
        onConnectSuccess(providerImage, selectedSlot);
        onClose();
        setStatus('idle');
        setApiKey('');
      }, 900);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02040A]/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-[#0A0F1D] border border-[#151D33] rounded-[20px] p-6 shadow-2xl flex flex-col text-[#E8EEFC] space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(34,211,238,0.12)] border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
              <Satellite className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-white">
                Connect Satellite Dataset
              </h3>
              <p className="text-xs text-[#8A97B8]">
                Stream orthomosaics directly from Earth observation APIs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A97B8] hover:text-white hover:bg-[#0F1627] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Selector (Asks "Which slot?") */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#5A6685] block">
            Target Slot
          </label>
          {mode === 'comparison' ? (
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#05070F] border border-[#151D33]">
              <button
                type="button"
                onClick={() => setSelectedSlot('past')}
                className={`py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  selectedSlot === 'past'
                    ? 'bg-[rgba(34,211,238,0.12)] text-[#22D3EE] font-semibold'
                    : 'text-[#8A97B8] hover:text-white'
                }`}
              >
                Past Image Slot
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlot('new')}
                className={`py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  selectedSlot === 'new'
                    ? 'bg-[rgba(34,211,238,0.12)] text-[#22D3EE] font-semibold'
                    : 'text-[#8A97B8] hover:text-white'
                }`}
              >
                New Image Slot
              </button>
            </div>
          ) : (
            <div className="py-2 px-3 rounded-xl bg-[#05070F] border border-[#151D33] text-xs font-mono text-[#8A97B8]">
              Interactive Input Slot (Active Image)
            </div>
          )}
        </div>

        {/* Provider Dropdown */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#5A6685] block">
            Provider Constellation
          </label>
          <select
            value={selectedProviderId}
            onChange={e => setSelectedProviderId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1627] border border-[#151D33] text-sm text-white focus:outline-none focus:border-[#22D3EE] transition-colors"
          >
            {SAMPLE_PROVIDERS.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name} ({provider.resolution} GSD, {provider.revisit})
              </option>
            ))}
          </select>
        </div>

        {/* Masked API Key Input */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#5A6685] block">
            API Secret Token
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="e.g. sk_live_copernicus_..."
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#0F1627] border border-[#151D33] text-sm text-white font-mono placeholder-[#5A6685] focus:outline-none focus:border-[#22D3EE] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A97B8] hover:text-white transition-colors"
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-[#5A6685]">
            Keys are held strictly in memory for this session and never saved to localStorage.
          </p>
        </div>

        {/* Status Line */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              status === 'error'
                ? 'bg-rose-500/10 text-[#F87171] border border-rose-500/20'
                : status === 'success'
                ? 'bg-emerald-500/10 text-[#34D399] border border-emerald-500/20'
                : 'bg-cyan-500/10 text-[#22D3EE] border border-cyan-500/20'
            }`}
          >
            {status === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {status === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {status === 'testing' && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
            <span className="leading-relaxed">{statusMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#151D33]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#8A97B8] hover:text-white hover:bg-[#0F1627] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConnect}
            disabled={status === 'testing'}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-[#22D3EE] hover:bg-[#67e8f9] disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all flex items-center gap-2 active:scale-95"
          >
            {status === 'testing' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <span>Connect Dataset</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
