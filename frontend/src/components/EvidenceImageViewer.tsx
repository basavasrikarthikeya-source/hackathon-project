import React, { useState, useRef, useEffect } from 'react';
import { BoundingBox, PolygonOutline } from '../types';
import { Box, Layers, Eye, EyeOff, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

interface EvidenceImageViewerProps {
  imageUrl: string;
  imageAlt?: string;
  boxes: BoundingBox[];
  polygons: PolygonOutline[];
  verdict: 'ANSWERED' | 'UNCERTAIN' | 'REFUSED';
  confidenceScore: number;
  categoryBreakdown?: { label: string; count: number; color?: string }[];
  hoveredDetectionId?: string | null;
  onHoverDetection?: (id: string | null) => void;
}

export const EvidenceImageViewer: React.FC<EvidenceImageViewerProps> = ({
  imageUrl,
  imageAlt = 'Satellite observation evidence',
  boxes,
  polygons,
  categoryBreakdown,
  hoveredDetectionId = null,
  onHoverDetection
}) => {
  const [overlayMode, setOverlayMode] = useState<'boxes' | 'outlines'>('boxes');
  const [showOverlays, setShowOverlays] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('16 / 9');
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [internalHoverId, setInternalHoverId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeHoverId = hoveredDetectionId !== undefined ? hoveredDetectionId : internalHoverId;

  // Calm color set per class: cyan, amber, mint
  const getClassColor = (category: string) => {
    switch (category) {
      case 'water':
      case 'vegetation':
        return {
          stroke: '#34D399', // mint
          fillBox: 'rgba(52, 211, 153, 0.06)',
          fillMask: 'rgba(52, 211, 153, 0.12)',
          labelBg: 'rgba(5, 15, 20, 0.85)',
          name: 'Mint'
        };
      case 'anomaly':
      case 'change':
        return {
          stroke: '#FBBF24', // amber
          fillBox: 'rgba(251, 191, 36, 0.06)',
          fillMask: 'rgba(251, 191, 36, 0.12)',
          labelBg: 'rgba(20, 15, 5, 0.85)',
          name: 'Amber'
        };
      case 'building':
      case 'infrastructure':
      default:
        return {
          stroke: '#22D3EE', // cyan accent
          fillBox: 'rgba(34, 211, 238, 0.06)',
          fillMask: 'rgba(34, 211, 238, 0.12)',
          labelBg: 'rgba(4, 10, 24, 0.85)',
          name: 'Cyan'
        };
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
    }
  };

  const toggleCategory = (cat: string) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.35, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.35, 1));
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

  // Build category legend with counts
  const categoriesList = categoryBreakdown || Array.from(
    new Set(boxes.map(b => b.category))
  ).map(cat => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: boxes.filter(b => b.category === cat).length,
    color: getClassColor(cat).stroke
  }));

  const visibleBoxes = boxes.filter(b => !hiddenCategories.has(b.category.toLowerCase()));
  const visiblePolygons = polygons.filter(p => !hiddenCategories.has(p.category.toLowerCase()));

  return (
    <div className="w-full space-y-3">
      {/* Evidence Image Container: True Aspect Ratio, 14px Radius, Hairline, Soft Shadow */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-[14px] overflow-hidden select-none group transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 bg-[#05070F] flex items-center justify-center p-6' : ''
        }`}
        style={{
          aspectRatio: isFullscreen ? 'auto' : aspectRatio,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)',
          outline: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Floating Icon-Only Pill Toolbar (Top-Right): --surface, radius 12px, hover reveal */}
        <div
          className="absolute top-3 right-3 z-30 flex items-center gap-1 p-1 rounded-[12px] border border-[rgba(255,255,255,0.10)] text-[#B4BFDA] shadow-xl opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(8, 12, 26, 0.86)' }}
          role="toolbar"
          aria-label="Image evidence controls"
        >
          {/* Toggle Boxes / Outlines */}
          <button
            type="button"
            onClick={() => setOverlayMode(m => (m === 'boxes' ? 'outlines' : 'boxes'))}
            title={overlayMode === 'boxes' ? 'Switch to Pixel-Precise Outlines' : 'Switch to Bounding Boxes'}
            className={`p-1.5 rounded-lg transition-colors ${
              overlayMode === 'outlines'
                ? 'bg-[rgba(34,211,238,0.16)] text-[#22D3EE]'
                : 'hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)]'
            }`}
            aria-label="Toggle boxes or outlines"
          >
            {overlayMode === 'boxes' ? (
              <Box className="w-4 h-4 text-[#22D3EE]" strokeWidth={1.5} />
            ) : (
              <Layers className="w-4 h-4 text-[#22D3EE]" strokeWidth={1.5} />
            )}
          </button>

          {/* Eye Toggle (Show / Hide) */}
          <button
            type="button"
            onClick={() => setShowOverlays(v => !v)}
            title={showOverlays ? 'Hide visual evidence overlays' : 'Show visual evidence overlays'}
            className={`p-1.5 rounded-lg transition-colors ${
              !showOverlays
                ? 'text-[#FBBF24] bg-[rgba(251,191,36,0.12)]'
                : 'hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)]'
            }`}
            aria-label="Toggle overlays visibility"
          >
            {showOverlays ? (
              <Eye className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <EyeOff className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>

          <div className="w-[1px] h-3.5 bg-[rgba(255,255,255,0.10)] mx-0.5" />

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            title="Zoom in"
            className="p-1.5 rounded-lg hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 transition-colors"
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
            className="p-1.5 rounded-lg hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
          </button>

          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset zoom"
              className="p-1.5 rounded-lg text-[#22D3EE] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}

          <div className="w-[1px] h-3.5 bg-[rgba(255,255,255,0.10)] mx-0.5" />

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            className="p-1.5 rounded-lg hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Inner Zoomable Viewport */}
        <div
          className="w-full h-full relative overflow-hidden flex items-center justify-center cursor-default transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imageUrl}
            alt={imageAlt}
            onLoad={handleImageLoad}
            className="w-full h-full object-cover block select-none pointer-events-none"
            loading="lazy"
          />

          {/* SVG Detections Layer */}
          {showOverlays && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-auto"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Bounding Boxes with Corner Ticks for small objects & 6% fill */}
              {overlayMode === 'boxes' &&
                visibleBoxes.map((box, idx) => {
                  const style = getClassColor(box.category);
                  const isHovered = activeHoverId === box.id;
                  const isDimmed = activeHoverId !== null && !isHovered;
                  const isSmall = box.width < 9 || box.height < 9;
                  const tick = Math.min(box.width * 0.35, box.height * 0.35, 2.2);

                  return (
                    <g
                      key={box.id}
                      className="cursor-pointer transition-opacity duration-150"
                      style={{ opacity: isDimmed ? 0.4 : 1 }}
                      onMouseEnter={() => {
                        setInternalHoverId(box.id);
                        onHoverDetection?.(box.id);
                      }}
                      onMouseLeave={() => {
                        setInternalHoverId(null);
                        onHoverDetection?.(null);
                      }}
                    >
                      {/* Box Fill: 6% opacity */}
                      <rect
                        x={box.x}
                        y={box.y}
                        width={box.width}
                        height={box.height}
                        fill={style.fillBox}
                      />

                      {/* Small boxes use corner ticks instead of full rectangles */}
                      {isSmall ? (
                        <g
                          stroke={style.stroke}
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {/* Top-left tick */}
                          <path d={`M ${box.x} ${box.y + tick} L ${box.x} ${box.y} L ${box.x + tick} ${box.y}`} />
                          {/* Top-right tick */}
                          <path d={`M ${box.x + box.width - tick} ${box.y} L ${box.x + box.width} ${box.y} L ${box.x + box.width} ${box.y + tick}`} />
                          {/* Bottom-left tick */}
                          <path d={`M ${box.x} ${box.y + box.height - tick} L ${box.x} ${box.y + box.height} L ${box.x + tick} ${box.y + box.height}`} />
                          {/* Bottom-right tick */}
                          <path d={`M ${box.x + box.width - tick} ${box.y + box.height} L ${box.x + box.width} ${box.y + box.height} L ${box.x + box.width} ${box.y + box.height - tick}`} />
                        </g>
                      ) : (
                        <rect
                          x={box.x}
                          y={box.y}
                          width={box.width}
                          height={box.height}
                          fill="none"
                          stroke={style.stroke}
                          strokeWidth="1.5"
                          rx="0.5"
                        />
                      )}

                      {/* Tiny numbered tag at top-left: mono 10px on dark pill */}
                      <g>
                        <rect
                          x={box.x}
                          y={Math.max(0, box.y - 3.4)}
                          width="5.2"
                          height="2.8"
                          fill="rgba(8, 12, 26, 0.90)"
                          stroke="rgba(255, 255, 255, 0.12)"
                          strokeWidth="0.3"
                          rx="0.6"
                        />
                        <text
                          x={box.x + 2.6}
                          y={Math.max(1.9, box.y - 1.5)}
                          textAnchor="middle"
                          fontSize="1.8"
                          fontFamily='"JetBrains Mono", monospace'
                          fontWeight="700"
                          fill={style.stroke}
                        >
                          {idx + 1}
                        </text>
                      </g>
                    </g>
                  );
                })}

              {/* Pixel-Precise Mask Outlines: 12% fill and 1.5px outline */}
              {overlayMode === 'outlines' &&
                visiblePolygons.map(poly => {
                  const style = getClassColor(poly.category);
                  const isHovered = activeHoverId === poly.id;
                  const isDimmed = activeHoverId !== null && !isHovered;

                  return (
                    <polygon
                      key={poly.id}
                      points={poly.points}
                      fill={style.fillMask}
                      stroke={style.stroke}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      className="cursor-pointer transition-opacity duration-150"
                      style={{ opacity: isDimmed ? 0.4 : 1 }}
                      onMouseEnter={() => {
                        setInternalHoverId(poly.id);
                        onHoverDetection?.(poly.id);
                      }}
                      onMouseLeave={() => {
                        setInternalHoverId(null);
                        onHoverDetection?.(null);
                      }}
                    />
                  );
                })}
            </svg>
          )}
        </div>
      </div>

      {/* Legend Row Under Image (Class chips with counts that toggle visibility) */}
      {categoriesList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 px-1">
          <span className="text-[11px] font-mono text-[#8793B3] uppercase tracking-wider mr-1">
            Detections:
          </span>
          {categoriesList.map(cat => {
            const isHidden = hiddenCategories.has(cat.label.toLowerCase());
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => toggleCategory(cat.label.toLowerCase())}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all border ${
                  isHidden
                    ? 'border-[rgba(255,255,255,0.06)] text-[#8793B3] line-through opacity-50'
                    : 'border-[rgba(255,255,255,0.12)] text-[#F2F6FF] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isHidden ? '#8793B3' : cat.color || '#22D3EE' }}
                />
                <span className="font-semibold">{cat.count}</span>
                <span className="text-[#B4BFDA]">{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
