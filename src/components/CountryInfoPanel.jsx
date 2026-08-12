import { useState, useRef, useEffect } from 'react';
import { getCountryDetails } from '../data/countryData';
import { getNeighborFeatures } from '../utils/countryUtils';

/**
 * Geographic Dossier & Inspector Surface
 * Complete UI rebuild: A specialized digital inspector viewport presenting
 * complete geographic telemetry, capital coordinates, population, area,
 * currency, languages, overview, neighboring borders, Wikipedia link, and share action.
 * Features drag-to-move header and resizable corner handle with touch event isolation.
 */
export default function CountryInfoPanel({ selectedFeature, onSelectCountry, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  // Position and Size state for Desktop
  const [position, setPosition] = useState(null); // { left: number, top: number }
  const [size, setSize] = useState({ width: 380, height: 440 });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const panelRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const dragRef = useRef({
    startMouseX: 0,
    startMouseY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const resizeRef = useRef({
    startMouseX: 0,
    startMouseY: 0,
    startWidth: 0,
    startHeight: 0,
  });

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

      const targetW = Math.min(size.width || 380, containerWidth - 16);
      const targetH = Math.min(size.height || 440, containerHeight - 80);

      const panelW = Math.max(Math.min(280, containerWidth - 16), targetW);
      const panelH = Math.max(Math.min(220, containerHeight - 80), targetH);

      let defaultLeft = Math.max(16, containerWidth - panelW - 24);
      let defaultTop = 80;

      if (containerWidth < 640) {
        defaultLeft = Math.max(8, (containerWidth - panelW) / 2);
        defaultTop = 72;
      }

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

  // Handle Share URL
  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?country=${encodeURIComponent(displayName)}`;
    if (navigator.share) {
      navigator.share({
        title: `${displayName} — Earth Explorer`,
        text: `Explore ${displayName} on Earth Explorer 3D Globe`,
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
    const currentTop = position?.top ?? 80;

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

      const panelW = panelRef.current ? panelRef.current.offsetWidth : (size.width || 380);
      const panelH = panelRef.current ? panelRef.current.offsetHeight : (size.height || 440);

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

    const currentW = panelRef.current ? panelRef.current.offsetWidth : (size.width || 380);
    const currentH = panelRef.current ? panelRef.current.offsetHeight : (size.height || 440);

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
      const currentTop = position?.top ?? 80;

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
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onResizeUp);
      window.removeEventListener('pointercancel', onResizeUp);
      window.removeEventListener('touchmove', onResizeMove);
      window.removeEventListener('touchend', onResizeUp);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  const currentLeft = position?.left ?? 16;
  const currentTop = position?.top ?? 80;

  // Mobile Bottom Sheet vs Desktop Floating Window inline styles
  const panelStyle = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        top: 'auto',
        width: '100%',
        maxHeight: '75vh',
        zIndex: 45,
      }
    : {
        position: 'absolute',
        left: `${currentLeft}px`,
        top: `${currentTop}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 45,
      };

  return (
    <div
      ref={panelRef}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={panelStyle}
      className={`bg-[#020617]/95 border-t sm:border border-cyan-500/40 rounded-t-2xl sm:rounded-lg p-3 sm:p-3.5 shadow-[0_-10px_35px_rgba(2,132,199,0.25)] sm:shadow-[0_0_35px_rgba(2,132,199,0.2)] text-slate-200 flex flex-col relative overflow-hidden transition-all duration-150 ease-out font-mono pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-3.5 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95 pointer-events-none'
      } ${
        isDragging || isResizing ? 'select-none border-cyan-400 !transition-none' : ''
      }`}
    >
      {/* Mobile Handle Indicator */}
      <div className="w-10 h-1 bg-cyan-500/50 rounded-full mx-auto mb-2 shrink-0 sm:hidden" />

      {/* Desktop Corner Bracket Accents */}
      <div className="hidden sm:block absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-cyan-400/80 pointer-events-none" />
      <div className="hidden sm:block absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-cyan-400/80 pointer-events-none" />
      <div className="hidden sm:block absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-cyan-400/80 pointer-events-none" />
      <div className="hidden sm:block absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-cyan-400/80 pointer-events-none" />

      {/* Inspector Header */}
      <div
        onPointerDown={!isMobile ? handleHeaderPointerDown : undefined}
        onTouchStart={!isMobile ? handleHeaderPointerDown : undefined}
        className={`flex items-center justify-between pb-2 border-b border-cyan-900/40 gap-2 select-none touch-none shrink-0 ${
          !isMobile && (isDragging ? 'cursor-grabbing' : 'cursor-grab')
        }`}
        title={!isMobile ? "Drag header to position inspector" : undefined}
      >
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          {/* Flag */}
          <div className="w-7 h-5 rounded-[2px] border border-cyan-800/80 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
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

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                DOSSIER
              </span>
              {details?.iso2 && (
                <span className="text-[9px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                  {details.iso2}
                </span>
              )}
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-wide font-sans mt-0.5">
              {displayName}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Share */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={handleShare}
            className="p-2 sm:p-1 text-slate-400 hover:text-cyan-300 transition-colors rounded hover:bg-slate-900/80 cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 text-[10px] focus-visible:outline-none"
            title="Share territory URL"
            aria-label="Share territory URL"
          >
            {copied ? (
              <span className="text-[9px] font-mono text-emerald-400 px-1 py-0.2 bg-emerald-950 rounded border border-emerald-800">
                COPIED
              </span>
            ) : (
              <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>

          {/* Close */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={handleClose}
            className="p-2 sm:p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-900 text-sm sm:text-xs flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 focus-visible:outline-none cursor-pointer"
            title="Close dossier"
            aria-label="Close dossier"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1 text-xs space-y-2 custom-scrollbar font-mono">
        {/* Technical Data Grid */}
        <div className="grid grid-cols-2 gap-1.5 bg-[#01040f]/80 border border-slate-800/80 rounded p-2 text-[10px]">
          {/* Capital */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] text-cyan-500 uppercase tracking-wider">CAPITAL CITY</span>
            <span className="text-slate-200 font-semibold truncate text-[11px] font-sans">
              {displayCapital}
            </span>
            {details?.capitalLat !== undefined && details?.capitalLon !== undefined && !isNaN(details.capitalLat) && details.capitalLat !== 0 && (
              <span className="text-[9px] text-slate-500 font-mono">
                {Math.abs(details.capitalLat).toFixed(2)}°{details.capitalLat >= 0 ? 'N' : 'S'}, {Math.abs(details.capitalLon).toFixed(2)}°{details.capitalLon >= 0 ? 'E' : 'W'}
              </span>
            )}
          </div>

          {/* Region */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] text-cyan-500 uppercase tracking-wider">REGION</span>
            <span className="text-slate-200 font-semibold truncate text-[11px] font-sans">
              {displayRegion}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              {displayContinent}
            </span>
          </div>

          {/* Population */}
          <div className="flex flex-col gap-0.5 min-w-0 pt-1 border-t border-slate-800/60">
            <span className="text-[9px] text-cyan-500 uppercase tracking-wider">POPULATION</span>
            <span className="text-slate-200 font-semibold text-[11px] truncate">
              {displayPopulation}
            </span>
          </div>

          {/* Area */}
          <div className="flex flex-col gap-0.5 min-w-0 pt-1 border-t border-slate-800/60">
            <span className="text-[9px] text-cyan-500 uppercase tracking-wider">SURFACE AREA</span>
            <span className="text-slate-200 font-semibold text-[11px] truncate">
              {displayArea}
            </span>
          </div>
        </div>

        {/* Currency & Language Row */}
        <div className="grid grid-cols-2 gap-1.5 bg-[#01040f]/80 border border-slate-800/80 rounded p-2 text-[10px]">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] text-cyan-500 uppercase tracking-wider">CURRENCY</span>
            <span className="text-slate-200 font-semibold text-[10px] truncate font-sans">
              {displayCurrency}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] text-cyan-500 uppercase tracking-wider">LANGUAGE</span>
            <span className="text-slate-200 font-semibold text-[10px] truncate font-sans">
              {displayLanguage}
            </span>
          </div>
        </div>

        {/* Overview */}
        {details?.overview && (
          <div className="p-2 bg-[#01040f]/60 border border-slate-800/80 rounded space-y-1">
            <span className="text-[9px] text-cyan-500 uppercase tracking-wider block">
              GEOGRAPHIC OVERVIEW
            </span>
            <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
              {details.overview}
            </p>
          </div>
        )}

        {/* Neighboring Borders */}
        {(() => {
          const neighbors = getNeighborFeatures(selectedFeature);
          return (
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-800/80">
              <span className="text-[9px] text-cyan-500 uppercase tracking-wider">
                ADJACENT BORDERS ({neighbors.length})
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
                        className="px-1.5 py-0.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 rounded text-[9px] text-cyan-300 font-medium cursor-pointer transition-colors flex items-center focus-visible:outline-none"
                        title={`Fly camera to ${nName}`}
                      >
                        {nName}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-slate-500 text-[10px] italic font-sans">
                  No adjacent land borders (Island nation/territory)
                </span>
              )}
            </div>
          );
        })()}

        {/* Wikipedia Link */}
        <div className="pt-1.5 border-t border-slate-800/80 flex justify-end">
          <a
            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(displayName)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>WIKIPEDIA REFERENCE</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Resize Handle Grip (Desktop only) */}
      <div
        onPointerDown={handleResizePointerDown}
        onTouchStart={handleResizePointerDown}
        className="hidden sm:flex absolute bottom-0 right-0 w-5 h-5 items-end justify-end p-0.5 cursor-nwse-resize select-none touch-none text-cyan-600 hover:text-cyan-400 transition-colors z-20"
        title="Resize dossier"
      >
        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 14H11V12H14V14ZM14 10H8V8H14V10ZM14 6H5V4H14V6Z" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
}
