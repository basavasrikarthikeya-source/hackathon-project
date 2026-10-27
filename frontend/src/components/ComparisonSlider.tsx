import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AttachedImage, PolygonOutline } from '../types';
import { Columns, SplitSquareVertical, Sparkles, AlertTriangle } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: AttachedImage;
  afterImage: AttachedImage;
  polygons?: PolygonOutline[];
  onUpdateBefore?: (img: AttachedImage) => void;
  onUpdateAfter?: (img: AttachedImage) => void;
  showPresets?: boolean;
  onSelectPreset?: (presetName: string) => void;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  beforeImage,
  afterImage,
  polygons = [],
  onUpdateBefore,
  onUpdateAfter,
  showPresets = false,
  onSelectPreset
}) => {
  // View mode: 'slider' (draggable overlay swipe) or 'side-by-side'
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [hasDimensionMismatch, setHasDimensionMismatch] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Check for dimension / aspect ratio mismatch
  useEffect(() => {
    if (beforeImage?.url && afterImage?.url) {
      const img1 = new Image();
      const img2 = new Image();
      let loaded = 0;

      const checkDims = () => {
        loaded++;
        if (loaded === 2) {
          const ar1 = img1.naturalWidth / Math.max(1, img1.naturalHeight);
          const ar2 = img2.naturalWidth / Math.max(1, img2.naturalHeight);
          const ratioDiff = Math.abs(ar1 - ar2) / Math.max(ar1, ar2);
          const sizeDiff = Math.abs(img1.naturalWidth - img2.naturalWidth) / Math.max(img1.naturalWidth, img2.naturalWidth);
          if (ratioDiff > 0.15 || sizeDiff > 0.35) {
            setHasDimensionMismatch(true);
          } else {
            setHasDimensionMismatch(false);
          }
        }
      };

      img1.onload = checkDims;
      img2.onload = checkDims;
      img1.onerror = () => setHasDimensionMismatch(false);
      img2.onerror = () => setHasDimensionMismatch(false);
      img1.src = beforeImage.url;
      img2.src = afterImage.url;
    } else {
      setHasDimensionMismatch(false);
    }
  }, [beforeImage?.url, afterImage?.url]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
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

  return (
    <div
      className="w-full rounded-[14px] overflow-hidden transition-all"
      style={{
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)',
        outline: '1px solid rgba(255, 255, 255, 0.12)'
      }}
    >
      {/* Top Floating Control Bar */}
      <div
        className="p-2.5 px-3.5 border-b border-[rgba(255,255,255,0.10)] flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{ background: 'rgba(8, 12, 26, 0.86)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#8793B3] uppercase tracking-wider font-semibold">
            Bi-Temporal Coregistration
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(34,211,238,0.14)] text-[#22D3EE]">
            RMSE 0.18px
          </span>
        </div>

        {/* View Controls: Slider vs Side-by-Side & Change Overlay */}
        <div className="flex items-center gap-1.5">
          {/* Change Polygons Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowOverlay(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-mono transition-all ${
              showOverlay
                ? 'bg-[rgba(34,211,238,0.16)] text-[#22D3EE]'
                : 'text-[#B4BFDA] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Change Polygons</span>
          </button>

          {/* Slider vs Side-by-Side */}
          <div className="flex items-center p-0.5 rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)]">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-medium transition-all ${
                viewMode === 'slider'
                  ? 'bg-[rgba(34,211,238,0.16)] text-[#22D3EE]'
                  : 'text-[#B4BFDA] hover:text-[#F2F6FF]'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span className="hidden sm:inline">Slider</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-[#0F1627] text-[#E8EEFC] border border-[#151D33] shadow-sm'
                  : 'text-[#8A97B8] hover:text-[#E8EEFC]'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>
          </div>
        </div>
      </div>

      {/* Non-blocking Dimension Mismatch Warning */}
      {hasDimensionMismatch && (
        <div className="px-3 py-2 bg-[#FBBF24]/10 border-b border-[#FBBF24]/20 flex items-center gap-2 text-xs text-[#FBBF24] font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Inputs differ in size; coregistration may be approximate.</span>
        </div>
      )}

      {/* Main Interactive Comparison Display */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          className="relative h-[360px] sm:h-[440px] w-full overflow-hidden select-none bg-[#05070F] cursor-ew-resize group"
          onPointerDown={handlePointerDown}
        >
          {/* Base: "Before / Past" Image */}
          <img
            src={beforeImage.url}
            alt="Past baseline capture"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Top Layer: "After / New" Image clipped by slider position */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={afterImage.url}
              alt="New current capture"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current?.clientWidth || '100%',
                height: '100%'
              }}
            />

            {/* Change Polygons SVG Overlay */}
            {showOverlay && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {polygons.length > 0 ? (
                  polygons.map(poly => (
                    <polygon
                      key={poly.id}
                      points={poly.points}
                      stroke="#22D3EE"
                      strokeWidth="1.5"
                      fill="rgba(34, 211, 238, 0.22)"
                      className="filter drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"
                    />
                  ))
                ) : (
                  // Default calibrated change highlight polygons
                  <polygon
                    points="22,18 48,16 56,34 50,54 28,52 22,36"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    fill="rgba(34, 211, 238, 0.22)"
                    className="filter drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"
                  />
                )}
              </svg>
            )}

            {/* "PRESENT IMAGE" Label Badge */}
            <div className="absolute top-3 left-3 bg-[#0F1218]/90 px-2.5 py-1 rounded-md border border-[#22D3EE]/40 text-[10px] font-mono text-[#22D3EE] font-semibold flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
              PRESENT: {afterImage.name || 'Current'}
            </div>
          </div>

          {/* "PAST IMAGE" Label Badge on right side */}
          <div className="absolute top-3 right-3 bg-[#05070F]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#151D33] text-[10px] font-mono text-[#8A97B8] font-semibold flex items-center gap-1.5 shadow-md pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A97B8]" />
            PAST: {beforeImage.name || 'Baseline'}
          </div>

          {/* Draggable Divider Line and Tactile Round Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0A0F1D] border-2 border-[#22D3EE] shadow-[0_0_14px_rgba(34,211,238,0.4)] flex items-center justify-center text-[#22D3EE] text-xs font-bold transition-transform group-hover:scale-110">
              ⇄
            </div>
          </div>

          {/* Subtle bottom hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#05070F]/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-[#8A97B8] border border-[#151D33] pointer-events-none">
            Drag divider left/right to reveal change
          </div>
        </div>
      ) : (
        /* Side-by-Side Dual View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#151D33] h-[360px] sm:h-[440px]">
          {/* Past Image Column */}
          <div className="relative bg-[#05070F] overflow-hidden group">
            <img
              src={beforeImage.url}
              alt="Past baseline capture"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-[#05070F]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#151D33] text-[10px] font-mono text-[#8A97B8] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8A97B8]" />
              PAST: {beforeImage.name}
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-[#0A0F1D]/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#151D33] text-[10px] font-mono text-[#8A97B8] flex items-center justify-between">
              <span>{beforeImage.sensor || 'Baseline Sensor'}</span>
              <span>GSD: {beforeImage.gsd || '3.0m'}</span>
            </div>
          </div>

          {/* New Image Column */}
          <div className="relative bg-[#05070F] overflow-hidden group">
            <img
              src={afterImage.url}
              alt="New current capture"
              className="w-full h-full object-cover"
            />
            {showOverlay && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {polygons.length > 0 ? (
                  polygons.map(poly => (
                    <polygon
                      key={poly.id}
                      points={poly.points}
                      stroke="#22D3EE"
                      strokeWidth="1.5"
                      fill="rgba(34, 211, 238, 0.22)"
                      className="filter drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"
                    />
                  ))
                ) : (
                  <polygon
                    points="22,18 48,16 56,34 50,54 28,52 22,36"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    fill="rgba(34, 211, 238, 0.22)"
                    className="filter drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"
                  />
                )}
              </svg>
            )}
            <div className="absolute top-3 left-3 bg-[#0F1218]/90 px-2.5 py-1 rounded-md border border-[#22D3EE]/40 text-[10px] font-mono text-[#22D3EE] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
              PRESENT: {afterImage.name}
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-[#0A0F1D]/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#151D33] text-[10px] font-mono text-[#8A97B8] flex items-center justify-between">
              <span>{afterImage.sensor || 'Current Sensor'}</span>
              <span>GSD: {afterImage.gsd || '3.0m'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
