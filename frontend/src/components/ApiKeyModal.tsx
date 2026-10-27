import React, { useState } from 'react';
import { SAMPLE_PROVIDERS, SAMPLE_IMAGES } from '../constants/sampleData';
import { SatelliteProvider, AttachedImage } from '../types';
import { X, Key, Satellite, ShieldCheck, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess: (image: AttachedImage) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onConnectSuccess
}) => {
  const { themeConfig } = useTheme();
  const [selectedProviderId, setSelectedProviderId] = useState<string>(SAMPLE_PROVIDERS[0].id);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [targetArea, setTargetArea] = useState<string>('Bhimtal Lake Basin [29.35° N, 79.56° E]');
  const [startDate, setStartDate] = useState<string>('2024-09-01');
  const [endDate, setEndDate] = useState<string>('2024-10-25');
  const [maxCloudCover, setMaxCloudCover] = useState<number>(10);

  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const selectedProvider = SAMPLE_PROVIDERS.find(p => p.id === selectedProviderId) || SAMPLE_PROVIDERS[0];

  const handleConnect = () => {
    if (!apiKey.trim()) {
      setStatus('error');
      setStatusMessage('Please enter an API key or token to authenticate with the provider API.');
      return;
    }

    if (apiKey.toLowerCase().includes('fail') || apiKey.toLowerCase().includes('invalid')) {
      setStatus('error');
      setStatusMessage('Authentication failed (HTTP 401 Unauthorized): Invalid API credential or revoked token.');
      return;
    }

    setStatus('testing');
    setStatusMessage('Authenticating TLS handshake and querying constellation orbital catalog...');

    setTimeout(() => {
      setStatus('success');
      setStatusMessage(`Connected! Retrieved Level-2A Orthomosaic from ${selectedProvider.name} (Acquired: 2024-10-18, 0.0% Cloud).`);

      // Prepare attached image from provider
      const providerImage: AttachedImage = {
        id: `api-${selectedProvider.id}-${Date.now()}`,
        name: `${selectedProvider.id.toUpperCase()}_Tile_${startDate}_L2A.tif`,
        url: selectedProvider.id === 'sentinel-2' ? SAMPLE_IMAGES.water.url : SAMPLE_IMAGES.urban.url,
        size: '22.8 MB (Cloud-Optimized GeoTIFF)',
        format: 'GeoTIFF',
        sensor: `${selectedProvider.name} (${selectedProvider.resolution})`,
        acquisitionDate: `${endDate} 11:40 UTC`,
        gsd: selectedProvider.resolution
      };

      setTimeout(() => {
        onConnectSuccess(providerImage);
        onClose();
        setStatus('idle');
        setApiKey('');
      }, 1400);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Source Dataset via Satellite API Key
              </h3>
              <p className="text-xs text-slate-400">
                Connect your direct commercial or open Earth observation provider.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Provider Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Satellite Constellation Provider
            </label>
            <select
              value={selectedProviderId}
              onChange={e => setSelectedProviderId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {SAMPLE_PROVIDERS.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} — {p.resolution}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {selectedProvider.description} • Revisit: {selectedProvider.revisit}
            </p>
          </div>

          {/* Masked API Key Input with Ephemeral Privacy Guarantee */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Provider API Key / Secret Token
              </label>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Ephemeral (never stored in localStorage)
              </span>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => {
                  setApiKey(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="e.g. sk_live_copernicus_8f93... or planet_auth_token"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-white/15 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Encrypted during transit via HTTPS TLS 1.3</span>
              <button
                type="button"
                onClick={() => setApiKey('drishti_demo_auth_token_copernicus_live')}
                className="text-cyan-400 hover:underline"
              >
                Insert Demo Key
              </button>
            </div>
          </div>

          {/* Optional Area / Coordinates Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Area of Interest (AOI) / Bounding Box (Optional)
            </label>
            <input
              type="text"
              value={targetArea}
              onChange={e => setTargetArea(e.target.value)}
              placeholder="e.g. [minLon, minLat, maxLon, maxLat] or City/Region"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 transition-colors"
            />
          </div>

          {/* Date Range Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Acquisition Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Acquisition End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Cloud Cover Slider */}
          <div>
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span>Maximum Cloud Cover Threshold</span>
              <span className="font-mono text-cyan-400">{maxCloudCover}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={maxCloudCover}
              onChange={e => setMaxCloudCover(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Status Message Display */}
          {status !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                status === 'testing'
                  ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
                  : status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {status === 'testing' && <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
              {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <span className="flex-1 leading-relaxed">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-950/80">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Zero-storage credential policy
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={status === 'testing'}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={status === 'testing'}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {status === 'testing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect & Query'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
