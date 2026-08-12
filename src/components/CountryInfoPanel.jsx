import { useState, useRef, useEffect } from 'react';
import { getCountryDetails } from '../data/countryData';
import { getNeighborFeatures } from '../utils/countryUtils';

/**
 * Professional Geographic Information Panel
 * Features drag-to-move header and resizable bottom-right corner.
 * Displays capital, population, land area, currency, languages, overview,
 * clickable neighbors, Wikipedia link, and share action.
 */
export default function CountryInfoPanel({ selectedFeature, onSelectCountry, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Explicit pixel-based positioning and sizing state
  const [position, setPosition] = useState(null); // { left: number, top: number }
  const [size, setSize] = useState({ width: 360, height: 420 }); // Default dimensions

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const panelRef = useRef(null);

  useEffect(() => {
    if (selectedFeature) {
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
    }
  }, [selectedFeature]);

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  // Dragging ref tracker
  const dragRef = useRef({
    startMouseX: 0,
    startMouseY: 0,
    startLeft: 0,
    startTop: 0,
  });

  // Resizing ref tracker
  const resizeRef = useRef({
    startMouseX: 0,
    startMouseY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  // Reset img error on country selection change
  useEffect(() => {
    setImgError(false);
    setCopied(false);
  }, [selectedFeature]);

  // Compute or validate initial position whenever selectedFeature opens or window resizes
  useEffect(() => {
    if (!selectedFeature) return;

    const computeInitialPos = () => {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      // Fit panel dimensions to smaller viewports automatically
      const targetW = Math.min(size.width || 360, containerWidth - 16);
      const targetH = Math.min(size.height || 420, containerHeight - 80);

      const panelW = Math.max(Math.min(280, containerWidth - 16), targetW);
      const panelH = Math.max(Math.min(220, containerHeight - 80), targetH);

      // Default initial position (top right for desktop, centered for mobile)
      let defaultLeft = Math.max(16, containerWidth - panelW - 24);
      let defaultTop = 72;

      if (containerWidth < 640) {
        defaultLeft = Math.max(8, (containerWidth - panelW) / 2);
        defaultTop = 64;
      }

      // Clamp coordinates strictly within viewport bounds with 8px margin
      const safeMinX = 8;
      const safeMaxX = Math.max(safeMinX, containerWidth - panelW - 8);
      const safeMinY = 8;
      const safeMaxY = Math.max(safeMinY, containerHeight - panelH - 8);

      if (panelW !== size.width || panelH !== size.height) {
        setSize({ width: panelW, height: panelH });
      }

      setPosition((prevPos) => {
        if (!prevPos) {
          return {
            left: Math.max(safeMinX, Math.min(defaultLeft, safeMaxX)),
            top: Math.max(safeMinY, Math.min(defaultTop, safeMaxY)),
          };
        }
        return {
          left: Math.max(safeMinX, Math.min(prevPos.left, safeMaxX)),
          top: Math.max(safeMinY, Math.min(prevPos.top, safeMaxY)),
        };
      });
    };

    computeInitialPos();
    window.addEventListener('resize', computeInitialPos);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', computeInitialPos);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFeature, size.width, size.height]);

  if (!selectedFeature) return null;

  const details = getCountryDetails(selectedFeature);

  const formatVal = (val, fallback = 'Data unavailable') => {
    if (!val || val === 'null' || val === 'undefined' || val === 'N/A' || val === 'Capital City' || val === 'Information unavailable') {
      return fallback;
    }
    return val;
  };

  const displayName = formatVal(details?.name, selectedFeature?.properties?.name || 'Selected Territory');
  const displayCapital = formatVal(details?.capital, 'Data unavailable');
  const displayRegion = formatVal(details?.region || details?.continent, 'Data unavailable');
  const displayContinent = formatVal(details?.continent, 'Data unavailable');
  const displayPopulation = formatVal(details?.population, 'Data unavailable');
  const displayArea = formatVal(details?.area, 'Data unavailable');
  const displayCurrency = formatVal(details?.currency, 'Data unavailable');
  const displayLanguage = formatVal(details?.language, 'Data unavailable');

  // Handle Share button
  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?country=${encodeURIComponent(displayName)}`;
    if (navigator.share) {
      navigator.share({
        title: `${displayName} — Earth Explorer`,
        text: `Explore ${displayName} on Earth Explorer 3D Interactive Globe`,
        url: shareUrl,
      }).catch(() => {
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  // Header Pointer Down for DRAGGING
  const handleHeaderPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();

    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    const currentLeft = position?.left ?? 16;
    const currentTop = position?.top ?? 72;

    dragRef.current = {
      startMouseX: clientX,
      startMouseY: clientY,
      startLeft: currentLeft,
      startTop: currentTop,
    };

    setIsDragging(true);

    const onPointerMove = (moveEvent) => {
      moveEvent.stopPropagation();
      if (moveEvent.cancelable) moveEvent.preventDefault();

      const curX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX ?? 0;
      const curY = moveEvent.clientY ?? moveEvent.touches?.[0]?.clientY ?? 0;

      const deltaX = curX - dragRef.current.startMouseX;
      const deltaY = curY - dragRef.current.startMouseY;

      const containerW = window.innerWidth;
      const containerH = window.innerHeight;

      const panelW = panelRef.current ? panelRef.current.offsetWidth : (size.width || 360);
      const panelH = panelRef.current ? panelRef.current.offsetHeight : (size.height || 420);

      const minX = 8;
      const maxX = Math.max(minX, containerW - panelW - 8);
      const minY = 8;
      const maxY = Math.max(minY, containerH - panelH - 8);

      const nextLeft = Math.max(minX, Math.min(maxX, dragRef.current.startLeft + deltaX));
      const nextTop = Math.max(minY, Math.min(maxY, dragRef.current.startTop + deltaY));

      setPosition({ left: nextLeft, top: nextTop });
    };

    const onPointerUp = (upEvent) => {
      upEvent.stopPropagation();
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  // Corner Pointer Down for RESIZING
  const handleResizePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();

    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    const currentW = panelRef.current ? panelRef.current.offsetWidth : (size.width || 360);
    const currentH = panelRef.current ? panelRef.current.offsetHeight : (size.height || 420);

    resizeRef.current = {
      startMouseX: clientX,
      startMouseY: clientY,
      startWidth: currentW,
      startHeight: currentH,
    };

    setIsResizing(true);

    const onResizeMove = (moveEvent) => {
      moveEvent.stopPropagation();
      if (moveEvent.cancelable) moveEvent.preventDefault();

      const curX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX ?? 0;
      const curY = moveEvent.clientY ?? moveEvent.touches?.[0]?.clientY ?? 0;

      const deltaX = curX - resizeRef.current.startMouseX;
      const deltaY = curY - resizeRef.current.startMouseY;

      const currentLeft = position?.left ?? 16;
      const currentTop = position?.top ?? 72;

      const minW = 280;
      const minH = 220;
      const maxW = Math.max(minW, window.innerWidth - currentLeft - 10);
      const maxH = Math.max(minH, window.innerHeight - currentTop - 10);

      const nextW = Math.max(minW, Math.min(maxW, resizeRef.current.startWidth + deltaX));
      const nextH = Math.max(minH, Math.min(maxH, resizeRef.current.startHeight + deltaY));

      setSize({ width: nextW, height: nextH });
    };

    const onResizeUp = (upEvent) => {
      upEvent.stopPropagation();
      setIsResizing(false);
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', onResizeUp);
      window.removeEventListener('pointercancel', onResizeUp);
      window.removeEventListener('touchmove', onResizeMove);
      window.removeEventListener('touchend', onResizeUp);
    };

    window.addEventListener('pointermove', onResizeMove, { passive: false });
    window.addEventListener('pointerup', onResizeUp);
    window.addEventListener('pointercancel', onResizeUp);
    window.addEventListener('touchmove', onResizeMove, { passive: false });
    window.addEventListener('touchend', onResizeUp);
  };

  const currentLeft = position?.left ?? 16;
  const currentTop = position?.top ?? 72;

  return (
    <div
      ref={panelRef}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: `${currentLeft}px`,
        top: `${currentTop}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 35,
      }}
      className={`bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-xl p-4 shadow-2xl text-slate-200 flex flex-col relative overflow-hidden transition-all duration-150 ease-out font-sans ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      } ${
        isDragging || isResizing ? 'select-none border-cyan-500/50 !transition-none' : ''
      }`}
    >
      {/* Panel Header */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onTouchStart={handleHeaderPointerDown}
        className={`flex items-center justify-between pb-3 border-b border-slate-800/80 gap-2 select-none touch-none shrink-0 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Drag header to move panel"
      >
        <div className="flex items-center gap-2.5 overflow-hidden pointer-events-none min-w-0">
          {/* Drag Handle Grip Icon */}
          <div className="text-slate-600 flex items-center shrink-0" aria-hidden="true">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.2" />
              <circle cx="11" cy="4" r="1.2" />
              <circle cx="5" cy="8" r="1.2" />
              <circle cx="11" cy="8" r="1.2" />
              <circle cx="5" cy="12" r="1.2" />
              <circle cx="11" cy="12" r="1.2" />
            </svg>
          </div>

          {/* Flag */}
          <div className="w-8 h-5.5 rounded border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {details?.flagUrl && !imgError ? (
              <img
                src={details.flagUrl}
                alt={`${displayName} flag`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs leading-none">{details?.flagEmoji || '🌐'}</span>
            )}
          </div>

          {/* Title & Official Name */}
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-slate-100 tracking-wide truncate leading-snug">
              {displayName}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {details?.officialName && details.officialName !== displayName
                ? details.officialName
                : (displayCapital !== 'Data unavailable' ? displayCapital : displayContinent)}
            </p>
          </div>
        </div>

        {/* Action Controls: Share & Close */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Share Button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={handleShare}
            className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors rounded hover:bg-slate-900/80 cursor-pointer flex items-center gap-1 text-xs focus-visible:outline-none"
            title="Share country URL"
            aria-label="Share country URL"
          >
            {copied ? (
              <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 bg-emerald-950/80 rounded border border-emerald-800/80">
                Copied!
              </span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>

          {/* Close Button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors rounded hover:bg-slate-900/80 cursor-pointer text-xs focus-visible:outline-none"
            title="Close panel"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Structured Content Area */}
      <div className="flex-1 overflow-y-auto mt-2.5 pr-1 text-xs space-y-2.5 font-sans custom-scrollbar">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/50 border border-slate-800/80 rounded-lg p-2.5">
          {/* Capital */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>🏛️</span> Capital
            </span>
            <span className="text-slate-200 font-semibold truncate text-[11px]">
              {displayCapital}
            </span>
            {details?.capitalLat !== undefined && details?.capitalLon !== undefined && !isNaN(details.capitalLat) && details.capitalLat !== 0 && (
              <span className="text-[9px] text-slate-400 font-mono truncate">
                {Math.abs(details.capitalLat).toFixed(1)}°{details.capitalLat >= 0 ? 'N' : 'S'}, {Math.abs(details.capitalLon).toFixed(1)}°{details.capitalLon >= 0 ? 'E' : 'W'}
              </span>
            )}
          </div>

          {/* Region / Continent */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>🌐</span> Region
            </span>
            <span className="text-slate-200 font-semibold truncate text-[11px]">
              {displayRegion}
            </span>
            <span className="text-[9px] text-slate-400 font-mono truncate">
              {displayContinent}
            </span>
          </div>

          {/* Population */}
          <div className="flex flex-col gap-0.5 min-w-0 pt-1 border-t border-slate-800/60">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>👥</span> Population
            </span>
            <span className="text-slate-100 font-mono font-semibold text-[11px] truncate">
              {displayPopulation}
            </span>
          </div>

          {/* Area */}
          <div className="flex flex-col gap-0.5 min-w-0 pt-1 border-t border-slate-800/60">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>📐</span> Area
            </span>
            <span className="text-slate-100 font-mono font-semibold text-[11px] truncate">
              {displayArea}
            </span>
          </div>
        </div>

        {/* Currency & Language Row */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/50 border border-slate-800/80 rounded-lg p-2.5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Currency
            </span>
            <span className="text-slate-200 font-semibold text-[11px] truncate">
              {displayCurrency}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Language
            </span>
            <span className="text-slate-200 font-semibold text-[11px] truncate">
              {displayLanguage}
            </span>
          </div>
        </div>

        {/* Overview Description if available */}
        {details?.overview && (
          <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
              Overview
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {details.overview}
            </p>
          </div>
        )}

        {/* Neighboring Countries */}
        {(() => {
          const neighbors = getNeighborFeatures(selectedFeature);
          return (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                Neighboring Borders ({neighbors.length})
              </span>
              {neighbors.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {neighbors.map((nFeat) => {
                    const nDetails = getCountryDetails(nFeat);
                    const nName = nDetails?.name || nFeat.properties?.name || 'Unknown';
                    return (
                      <button
                        key={nName}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectCountry) {
                            onSelectCountry(nFeat);
                          }
                        }}
                        className="px-2 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-[10px] text-cyan-300/90 hover:text-cyan-200 font-medium cursor-pointer transition-colors flex items-center focus-visible:outline-none"
                        title={`Fly camera to ${nName}`}
                        aria-label={`Select ${nName}`}
                      >
                        {nName}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-slate-400 text-[10px] italic font-sans">
                  None (Island nation or territory)
                </span>
              )}
            </div>
          );
        })()}

        {/* External Link */}
        <div className="pt-2 border-t border-slate-800/80 flex justify-end">
          <a
            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(displayName)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Learn more on Wikipedia</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Resize Handle Grip */}
      <div
        onPointerDown={handleResizePointerDown}
        onTouchStart={handleResizePointerDown}
        className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-0.5 cursor-nwse-resize select-none touch-none text-slate-600 hover:text-slate-400 transition-colors z-20"
        title="Drag corner to resize panel"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 14H11V12H14V14ZM14 10H8V8H14V10ZM14 6H5V4H14V6Z" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}
