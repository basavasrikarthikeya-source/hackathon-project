import React, { useState, useRef } from 'react';
import { Plus, Upload, Globe, Key, X, Image as ImageIcon, Check } from 'lucide-react';
import { AttachedImage } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ApiKeyModal } from './ApiKeyModal';
import { SAMPLE_IMAGES } from '../constants/sampleData';

interface AttachMenuProps {
  attachedImages: AttachedImage[];
  onAddImage: (img: AttachedImage) => void;
  onRemoveImage: (id: string) => void;
}

export const AttachMenu: React.FC<AttachMenuProps> = ({
  attachedImages,
  onAddImage,
  onRemoveImage
}) => {
  const { themeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showWebUrlInput, setShowWebUrlInput] = useState(false);
  const [webUrl, setWebUrl] = useState('');
  const [webUrlError, setWebUrlError] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // File picker handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      const isTiff = file.name.endsWith('.tif') || file.name.endsWith('.tiff');

      const newImg: AttachedImage = {
        id: `upload-${Date.now()}-${i}`,
        name: file.name,
        url: objectUrl,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        format: isTiff ? 'GeoTIFF' : file.type.includes('png') ? 'PNG' : 'JPG',
        sensor: isTiff ? 'Raster Orthomosaic (GeoTIFF)' : 'High-Res Optical Capture',
        gsd: isTiff ? 'Calibrated 0.3m' : 'Standard Optical'
      };

      onAddImage(newImg);
    }

    setIsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Web URL handler
  const handleWebUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webUrl.trim()) return;

    try {
      new URL(webUrl);
      const filename = webUrl.split('/').pop()?.split('?')[0] || 'web-satellite-tile.jpg';
      const newImg: AttachedImage = {
        id: `web-${Date.now()}`,
        name: filename,
        url: webUrl,
        size: '1.8 MB (Remote Cache)',
        format: 'Web URL',
        sensor: 'Remote Satellite Tile Stream'
      };

      onAddImage(newImg);
      setWebUrl('');
      setShowWebUrlInput(false);
      setIsOpen(false);
      setWebUrlError('');
    } catch {
      setWebUrlError('Please enter a valid HTTP or HTTPS image URL.');
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* The + Button */}
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          title="Attach satellite image or dataset"
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center border border-white/10 active:scale-95 group shadow-sm"
        >
          <Plus
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
            style={{ color: isOpen ? themeConfig.primaryHex : undefined }}
          />
        </button>

        {/* Hidden Device File Picker (PNG, JPG, GeoTIFF) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/png, image/jpeg, image/tiff, .tif, .tiff"
          multiple
          className="hidden"
        />

        {/* Popover Menu */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-3 w-72 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-2 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-1.5 border-b border-white/10 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Attach Satellite Source
            </div>

            <div className="space-y-1 mt-1">
              {/* Option A: Upload from device */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-800 text-left flex items-start gap-2.5 group transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Upload from device
                  </div>
                  <div className="text-[11px] text-slate-400">
                    PNG, JPG, GeoTIFF (.tif)
                  </div>
                </div>
              </button>

              {/* Option B: Add image from web */}
              <button
                type="button"
                onClick={() => setShowWebUrlInput(v => !v)}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-800 text-left flex items-start gap-2.5 group transition-colors"
              >
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Add image from web
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Paste public image URL
                  </div>
                </div>
              </button>

              {/* Option C: Source dataset via API key */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsApiKeyModalOpen(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-800 text-left flex items-start gap-2.5 group transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    Source dataset via API key
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                      LIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sentinel-2, PlanetScope, Maxar, Landsat
                  </div>
                </div>
              </button>

              {/* Quick sample datasets */}
              <div className="pt-1.5 border-t border-white/5 mt-1">
                <div className="px-2 py-1 text-[10px] font-mono text-slate-500 uppercase">
                  Quick Load Demo Tile
                </div>
                <div className="grid grid-cols-2 gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAddImage(SAMPLE_IMAGES.urban);
                      setIsOpen(false);
                    }}
                    className="text-[11px] text-slate-300 hover:text-cyan-300 hover:bg-slate-800 px-2 py-1 rounded text-left truncate"
                  >
                    🏢 Urban 0.3m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAddImage(SAMPLE_IMAGES.water);
                      setIsOpen(false);
                    }}
                    className="text-[11px] text-slate-300 hover:text-cyan-300 hover:bg-slate-800 px-2 py-1 rounded text-left truncate"
                  >
                    💧 Lake Basin
                  </button>
                </div>
              </div>
            </div>

            {/* Inline Web URL Form */}
            {showWebUrlInput && (
              <form onSubmit={handleWebUrlSubmit} className="mt-2 pt-2 border-t border-white/10 px-1">
                <div className="text-[11px] text-slate-300 mb-1">Paste Image URL:</div>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={webUrl}
                    onChange={e => setWebUrl(e.target.value)}
                    placeholder="https://...image.jpg"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-white/15 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
                  >
                    Load
                  </button>
                </div>
                {webUrlError && (
                  <p className="text-[10px] text-rose-400 mt-1">{webUrlError}</p>
                )}
              </form>
            )}
          </div>
        )}
      </div>

      {/* Dataset Source API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onConnectSuccess={img => onAddImage(img)}
      />
    </>
  );
};
