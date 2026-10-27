import React, { useState, useRef } from 'react';
import { BoundingBox, PolygonOutline } from '../types';
import { Layers, Box, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Maximize2, Shield, Crosshair } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface EvidenceImageViewerProps {
  imageUrl: string;
  imageAlt?: string;
  boxes: BoundingBox[];
  polygons: PolygonOutline[];
  verdict: 'ANSWERED' | 'UNCERTAIN' | 'REFUSED';
  confidenceScore: number;
}

export const EvidenceImageViewer: React.FC<EvidenceImageViewerProps> = ({
  imageUrl,
  imageAlt = 'Satellite observation evidence',
  boxes,
  polygons,
  verdict,
  confidenceScore
}) => {
  const { themeConfig } = useTheme();
  // Toggle between 'boxes' and 'outlines' as requested by the prompt: "toggle: Boxes / Pixel-precise outlines"
  const [overlayMode, setOverlayMode] = useState<'boxes' | 'outlines'>('boxes');
  const [showOverlays, setShowOverlays] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredItem, setHoveredItem] = useState<{ id: string; label: string; confidence: number } | null>(null);
  const [showScanlines, setShowScanlines] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 1));
  const handleResetZoom = () => setZoomLevel(1);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Color mapping by category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'water':
        return { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.25)', text: 'text-cyan-300', bg: 'bg-cyan-500/20' };
      case 'change':
        return { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.25)', text: 'text-rose-300', bg: 'bg-rose-500/20' };
      case 'anomaly':
        return { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', text: 'text-amber-300', bg: 'bg-amber-500/20' };
      case 'vegetation':
        return { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.25)', text: 'text-emerald-300', bg: 'bg-emerald-500/20' };
      case 'building':
      default:
        return { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.22)', text: 'text-sky-300', bg: 'bg-sky-500/20' };
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl transition-all ${
        isFullscreen ? 'p-4 flex flex-col justify-center items-center h-screen' : ''
      }`}
    >
      {/* Top Header / Evidence Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 border-b border-white/10 text-xs">
        {/* Toggle: "Boxes / Pixel-precise outlines" */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setOverlayMode('boxes')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-medium transition-all ${
              overlayMode === 'boxes'
                ? 'bg-slate-800 text-white shadow-sm border border-white/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" style={{ color: themeConfig.primaryHex }} />
            <span>Boxes</span>
          </button>

          <button
            type="button"
            onClick={() => setOverlayMode('outlines')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-medium transition-all ${
              overlayMode === 'outlines'
                ? 'bg-slate-800 text-white shadow-sm border border-white/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: themeConfig.primaryHex }} />
            <span>Pixel-precise outlines</span>
          </button>
        </div>

        {/* View Controls: Visibility, Zoom, Scanline, Fullscreen */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => setShowOverlays(v => !v)}
            title={showOverlays ? 'Hide overlay layer' : 'Show overlay layer'}
            className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors ${
              !showOverlays ? 'text-amber-400' : 'hover:text-white'
            }`}
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <div className="h-3 w-px bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            title="Zoom In"
            className="p-1.5 rounded-md hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[10px] w-8 text-center text-slate-300">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            title="Zoom Out"
            className="p-1.5 rounded-md hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-3 w-px bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={() => setShowScanlines(v => !v)}
            title="Toggle Radar/Scanline HUD"
            className={`p-1.5 rounded-md transition-colors ${
              showScanlines ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Overlays */}
      <div className="relative overflow-hidden bg-black/60 flex items-center justify-center select-none min-h-[300px] max-h-[520px]">
        {/* Optical Image */}
        <div
          className="relative transition-transform duration-200 ease-out origin-center w-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto max-h-[520px] object-cover block"
            loading="lazy"
          />

          {/* Radar Scanline Overlay if enabled */}
          {showScanlines && (
            <div className="absolute inset-0 pointer-events-none scanline-overlay opacity-60 z-10" />
          )}

          {/* Refusal Shield Overlay for REFUSED state */}
          {verdict === 'REFUSED' && (
            <div className="absolute inset-0 bg-red-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="p-3 bg-red-500/20 rounded-full border border-red-500/40 mb-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <span className="font-mono text-xs uppercase font-bold text-red-300 tracking-wider">
                Evidence Display Restricted
              </span>
              <p className="text-slate-300 text-xs mt-1 max-w-sm">
                Optical resolution safety guardrail activated. Drishti will not render simulated biometric boundaries.
              </p>
            </div>
          )}

          {/* SVG Overlay Layer for Bounding Boxes and Polygons */}
          {showOverlays && verdict !== 'REFUSED' && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Mode A: Boxes */}
              {overlayMode === 'boxes' &&
                boxes.map(box => {
                  const style = getCategoryColor(box.category);
                  const isHovered = hoveredItem?.id === box.id;
                  return (
                    <g
                      key={box.id}
                      className="cursor-pointer pointer-events-auto transition-all"
                      onMouseEnter={() => setHoveredItem({ id: box.id, label: box.label, confidence: box.confidence })}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <rect
                        x={`${box.x}%`}
                        y={`${box.y}%`}
                        width={`${box.width}%`}
                        height={`${box.height}%`}
                        fill={isHovered ? style.fill.replace('0.22', '0.45') : style.fill}
                        stroke={style.stroke}
                        strokeWidth={isHovered ? '0.6' : '0.35'}
                        strokeDasharray={isHovered ? 'none' : '1.5, 0.8'}
                        className="transition-all duration-150"
                      />
                      {/* Corner crosshairs for tactical aesthetic */}
                      <line
                        x1={`${box.x}%`}
                        y1={`${box.y}%`}
                        x2={`${box.x + 2}%`}
                        y2={`${box.y}%`}
                        stroke={style.stroke}
                        strokeWidth="0.8"
                      />
                      <line
                        x1={`${box.x}%`}
                        y1={`${box.y}%`}
                        x2={`${box.x}%`}
                        y2={`${box.y + 2}%`}
                        stroke={style.stroke}
                        strokeWidth="0.8"
                      />
                    </g>
                  );
                })}

              {/* Mode B: Pixel-precise Polygons */}
              {overlayMode === 'outlines' &&
                polygons.map(poly => {
                  const style = getCategoryColor(poly.category);
                  const isHovered = hoveredItem?.id === poly.id;
                  return (
                    <g
                      key={poly.id}
                      className="cursor-pointer pointer-events-auto transition-all"
                      onMouseEnter={() => setHoveredItem({ id: poly.id, label: poly.label, confidence: poly.confidence })}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <polygon
                        points={poly.points}
                        fill={isHovered ? style.fill.replace('0.22', '0.5') : style.fill}
                        stroke={style.stroke}
                        strokeWidth={isHovered ? '0.6' : '0.4'}
                        strokeLinejoin="round"
                        className="transition-all duration-150 filter drop-shadow-[0_0_3px_rgba(6,182,212,0.6)]"
                      />
                    </g>
                  );
                })}
            </svg>
          )}
        </div>

        {/* Hovered Feature Tooltip HUD */}
        {hoveredItem && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 px-3 py-1.5 rounded-lg shadow-xl text-xs z-30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-medium text-slate-100">{hoveredItem.label}</span>
            <span className="font-mono text-[11px] text-cyan-300 font-semibold">
              {hoveredItem.confidence.toFixed(1)}% conf
            </span>
          </div>
        )}

        {/* Bottom-right Status Badge */}
        <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-2 z-20">
          <span className="text-slate-400">Layer:</span>
          <span className="text-cyan-400 uppercase font-semibold">
            {overlayMode === 'boxes' ? `${boxes.length} Bounding Boxes` : `${polygons.length} Pixel Outlines`}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Certainty:</span>
          <span
            className={`font-semibold ${
              confidenceScore >= 80 ? 'text-emerald-400' : confidenceScore >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}
          >
            {confidenceScore > 0 ? `${confidenceScore.toFixed(1)}%` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
