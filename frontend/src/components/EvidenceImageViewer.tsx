import React, { useState, useRef } from 'react';
import { BoundingBox, PolygonOutline } from '../types';
import { Box, Layers, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

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
}) => {
  const [overlayMode, setOverlayMode] = useState<'boxes' | 'outlines'>('boxes');
  const [showOverlays, setShowOverlays] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'water':
        return { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.25)' };
      case 'change':
        return { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.25)' };
      case 'anomaly':
        return { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)' };
      case 'vegetation':
        return { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.25)' };
      case 'building':
      default:
        return { stroke: '#22d3ee', fill: 'rgba(34, 211, 238, 0.22)' };
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-[14px] overflow-hidden bg-[#05070F] border border-[#151D33] select-none group ${
        isFullscreen ? 'h-screen p-4 flex items-center justify-center' : ''
      }`}
    >
      {/* Floating Icon-Only Toolbar */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 p-1 rounded-xl bg-[#0A0F1D]/80 backdrop-blur-md border border-[#151D33] text-[#8A97B8] shadow-lg">
        {/* Boxes / Outlines toggle */}
        <button
          type="button"
          onClick={() => setOverlayMode(m => (m === 'boxes' ? 'outlines' : 'boxes'))}
          title={overlayMode === 'boxes' ? 'Switch to Pixel-Precise Outlines' : 'Switch to Bounding Boxes'}
          className={`p-1.5 rounded-lg transition-colors ${
            overlayMode === 'outlines' ? 'bg-[#0F1627] text-[#22D3EE]' : 'hover:text-white hover:bg-[#0F1627]'
          }`}
          aria-label="Toggle boxes or outlines"
        >
          {overlayMode === 'boxes' ? (
            <Box className="w-4 h-4 text-[#22D3EE]" strokeWidth={1.5} />
          ) : (
            <Layers className="w-4 h-4 text-[#22D3EE]" strokeWidth={1.5} />
          )}
        </button>

        {/* Visibility Eye Toggle */}
        <button
          type="button"
          onClick={() => setShowOverlays(v => !v)}
          title={showOverlays ? 'Hide visual evidence overlays' : 'Show visual evidence overlays'}
          className={`p-1.5 rounded-lg transition-colors ${
            !showOverlays ? 'text-[#FBBF24]' : 'hover:text-white hover:bg-[#0F1627]'
          }`}
          aria-label="Toggle overlays visibility"
        >
          {showOverlays ? <Eye className="w-4 h-4" strokeWidth={1.5} /> : <EyeOff className="w-4 h-4" strokeWidth={1.5} />}
        </button>

        <div className="w-[1px] h-3.5 bg-[#151D33] mx-0.5" />

        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 2.5}
          title="Zoom in"
          className="p-1.5 rounded-lg hover:text-white hover:bg-[#0F1627] disabled:opacity-30 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 1}
          title="Zoom out"
          className="p-1.5 rounded-lg hover:text-white hover:bg-[#0F1627] disabled:opacity-30 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {zoomLevel > 1 && (
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset zoom"
            className="p-1.5 rounded-lg text-cyan-400 hover:bg-[#0F1627] transition-colors"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        )}

        <div className="w-[1px] h-3.5 bg-[#151D33] mx-0.5" />

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          className="p-1.5 rounded-lg hover:text-white hover:bg-[#0F1627] transition-colors"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" strokeWidth={1.5} /> : <Maximize2 className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>

      {/* Main Image Viewport */}
      <div className="relative w-full overflow-hidden flex items-center justify-center max-h-[500px]">
        <div
          className="relative inline-block transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto max-h-[500px] object-contain block"
          />

          {/* SVG Vector Overlays */}
          {showOverlays && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Bounding Boxes */}
              {overlayMode === 'boxes' &&
                boxes.map(box => {
                  const style = getCategoryColor(box.category);
                  return (
                    <g key={box.id}>
                      <rect
                        x={box.x}
                        y={box.y}
                        width={box.width}
                        height={box.height}
                        fill={style.fill}
                        stroke={style.stroke}
                        strokeWidth="0.8"
                        strokeDasharray="2,1"
                      />
                      <rect
                        x={box.x}
                        y={Math.max(0, box.y - 3.5)}
                        width={Math.min(box.label.length * 2.2, 35)}
                        height="3.2"
                        fill="rgba(5, 7, 15, 0.85)"
                        rx="0.5"
                      />
                      <text
                        x={box.x + 0.8}
                        y={Math.max(2.4, box.y - 1.2)}
                        fontSize="2.1"
                        fontFamily="monospace"
                        fontWeight="600"
                        fill={style.stroke}
                      >
                        {box.label} ({box.confidence}%)
                      </text>
                    </g>
                  );
                })}

              {/* Polygon Outlines */}
              {overlayMode === 'outlines' &&
                polygons.map(poly => {
                  const style = getCategoryColor(poly.category);
                  return (
                    <g key={poly.id}>
                      <polygon
                        points={poly.points}
                        fill={style.fill}
                        stroke={style.stroke}
                        strokeWidth="0.8"
                      />
                    </g>
                  );
                })}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
