import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AttachedImage } from '../types';
import { Columns, SplitSquareVertical, Upload, Calendar, Compass, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SAMPLE_IMAGES } from '../constants/sampleData';

interface ComparisonSliderProps {
  beforeImage: AttachedImage;
  afterImage: AttachedImage;
  onUpdateBefore: (img: AttachedImage) => void;
  onUpdateAfter: (img: AttachedImage) => void;
  onSelectPreset?: (presetName: string) => void;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  beforeImage,
  afterImage,
  onUpdateBefore,
  onUpdateAfter,
  onSelectPreset
}) => {
  const { themeConfig } = useTheme();
  // View mode: 'slider' (draggable overlay swipe) or 'side-by-side'
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showDiffHighlight, setShowDiffHighlight] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const newImg: AttachedImage = {
      id: `upload-${Date.now()}-${target}`,
      name: file.name,
      url: objectUrl,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      format: file.name.endsWith('.tif') || file.name.endsWith('.tiff') ? 'GeoTIFF' : 'PNG',
      type: target,
      sensor: 'Uploaded Sensor Orthomosaic',
      acquisitionDate: 'Custom Upload',
      gsd: 'Calibrated GSD'
    };

    if (target === 'before') {
      onUpdateBefore(newImg);
    } else {
      onUpdateAfter(newImg);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-xl mb-4 backdrop-blur-md">
      {/* Top Header & Slot Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <SplitSquareVertical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Bi-Temporal Comparison Viewer
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Coregistered RMSE 0.18px
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Drag slider to inspect ground changes or toggle side-by-side view.
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Slider vs Side-by-Side */}
        <div className="flex items-center gap-2">
          {/* Quick presets */}
          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => {
                onUpdateBefore(SAMPLE_IMAGES.forestBefore);
                onUpdateAfter(SAMPLE_IMAGES.forestAfter);
                onSelectPreset?.('forest');
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 transition-colors"
            >
              Forest Canopy
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateBefore(SAMPLE_IMAGES.floodBefore);
                onUpdateAfter(SAMPLE_IMAGES.floodAfter);
                onSelectPreset?.('flood');
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 transition-colors"
            >
              Flood Extent
            </button>
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'slider'
                  ? 'bg-slate-800 text-white shadow-sm border border-white/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" style={{ color: themeConfig.primaryHex }} />
              <span>Slider Swipe</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-slate-800 text-white shadow-sm border border-white/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" style={{ color: themeConfig.primaryHex }} />
              <span>Side-by-Side</span>
            </button>
          </div>

          {/* Diff Highlight Toggle */}
          <button
            type="button"
            onClick={() => setShowDiffHighlight(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
              showDiffHighlight
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-white/10 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Diff Mask</span>
          </button>
        </div>
      </div>

      {/* Two Upload Slots: "Before" and "After" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Before Upload Slot */}
        <div
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const objectUrl = URL.createObjectURL(file);
              const isTiff = file.name.endsWith('.tif') || file.name.endsWith('.tiff');
              onUpdateBefore({
                id: `upload-${Date.now()}-before`,
                name: file.name,
                url: objectUrl,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                format: isTiff ? 'GeoTIFF' : 'PNG',
                type: 'before',
                sensor: 'Custom Drop Sensor',
                acquisitionDate: 'Custom Drag & Drop',
                gsd: 'Calibrated GSD'
              });
            }
          }}
          className="relative p-2.5 rounded-xl border border-dashed border-white/15 bg-slate-950/60 hover:border-cyan-500/40 transition-colors flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={beforeImage.url}
              alt="Before baseline thumbnail"
              className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                  Before
                </span>
                <span className="text-xs font-medium text-slate-200 truncate">
                  {beforeImage.name}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{beforeImage.acquisitionDate || '2022 Baseline'}</span>
                <span>•</span>
                <span>{beforeImage.sensor || 'Dove 3m'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => beforeFileInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 shrink-0 border border-white/5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="text-[11px]">Replace</span>
          </button>
          <input
            type="file"
            ref={beforeFileInputRef}
            onChange={e => handleFileChange(e, 'before')}
            accept="image/png, image/jpeg, image/tiff"
            className="hidden"
          />
        </div>

        {/* After Upload Slot */}
        <div
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const objectUrl = URL.createObjectURL(file);
              const isTiff = file.name.endsWith('.tif') || file.name.endsWith('.tiff');
              onUpdateAfter({
                id: `upload-${Date.now()}-after`,
                name: file.name,
                url: objectUrl,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                format: isTiff ? 'GeoTIFF' : 'PNG',
                type: 'after',
                sensor: 'Custom Drop Sensor',
                acquisitionDate: 'Custom Drag & Drop',
                gsd: 'Calibrated GSD'
              });
            }
          }}
          className="relative p-2.5 rounded-xl border border-dashed border-white/15 bg-slate-950/60 hover:border-cyan-500/40 transition-colors flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={afterImage.url}
              alt="After current thumbnail"
              className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  After
                </span>
                <span className="text-xs font-medium text-slate-200 truncate">
                  {afterImage.name}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{afterImage.acquisitionDate || '2024 Current'}</span>
                <span>•</span>
                <span>{afterImage.sensor || 'Dove 3m'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => afterFileInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 shrink-0 border border-white/5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="text-[11px]">Replace</span>
          </button>
          <input
            type="file"
            ref={afterFileInputRef}
            onChange={e => handleFileChange(e, 'after')}
            accept="image/png, image/jpeg, image/tiff"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Comparison Display: Either Draggable Slider or Side-by-Side */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          className="relative h-[340px] sm:h-[420px] w-full rounded-xl overflow-hidden select-none border border-white/10 bg-black cursor-ew-resize"
          onPointerDown={handlePointerDown}
        >
          {/* Base: "Before" Image */}
          <img
            src={beforeImage.url}
            alt="Before baseline satellite capture"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Top Layer: "After" Image clipped by slider position */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={afterImage.url}
              alt="After current satellite capture"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current?.clientWidth || '100%',
                height: '100%'
              }}
            />

            {/* Optional Change Diff Glow in After Layer */}
            {showDiffHighlight && (
              <div className="absolute inset-0 bg-rose-500/20 mix-blend-color-dodge pointer-events-none" />
            )}

            {/* "After" Label Badge */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-rose-500/40 text-[11px] font-mono text-rose-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              AFTER: {afterImage.acquisitionDate || 'Current'}
            </div>
          </div>

          {/* "Before" Label Badge on right side */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-500/40 text-[11px] font-mono text-blue-300 font-bold flex items-center gap-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            BEFORE: {beforeImage.acquisitionDate || 'Baseline'}
          </div>

          {/* Draggable Divider Line and Tactile Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-2xl flex items-center justify-center text-cyan-300 text-[10px] font-bold">
              ⇄
            </div>
          </div>

          {/* Bottom HUD Hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-slate-300 border border-white/10 pointer-events-none">
            Drag divider left/right to reveal change
          </div>
        </div>
      ) : (
        /* Side-by-Side Viewer */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-[340px] sm:h-[420px]">
          {/* Before Column */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black group">
            <img
              src={beforeImage.url}
              alt="Before baseline satellite capture"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-500/40 text-[11px] font-mono text-blue-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              BEFORE: {beforeImage.acquisitionDate || 'Baseline'}
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 flex items-center justify-between">
              <span>{beforeImage.sensor}</span>
              <span>GSD: {beforeImage.gsd || '3.0m'}</span>
            </div>
          </div>

          {/* After Column */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black group">
            <img
              src={afterImage.url}
              alt="After current satellite capture"
              className="w-full h-full object-cover"
            />
            {showDiffHighlight && (
              <div className="absolute inset-0 bg-rose-500/20 mix-blend-color-dodge pointer-events-none" />
            )}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-rose-500/40 text-[11px] font-mono text-rose-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              AFTER: {afterImage.acquisitionDate || 'Current'}
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 flex items-center justify-between">
              <span>{afterImage.sensor}</span>
              <span>GSD: {afterImage.gsd || '3.0m'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
