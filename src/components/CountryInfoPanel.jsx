import React, { useState, useRef, useEffect } from 'react';
import { getCountryDetails } from '../data/countryData';
import { getNeighborFeatures } from '../utils/countryUtils';

/**
 * Clean, professional, compact information panel displaying basic geographic info.
 * Styled to seamlessly integrate with the project's high-tech / sci-fi HUD theme.
 * Features stable drag-to-move header and resizable bottom-right corner.
 */
export default function CountryInfoPanel({ selectedFeature, onSelectCountry, onClose }) {
  const [imgError, setImgError] = useState(false);

  // Explicit pixel-based positioning and sizing state
  const [position, setPosition] = useState(null); // { left: number, top: number }
  const [size, setSize] = useState({ width: 340, height: 310 }); // Default dimensions

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
  }, [selectedFeature]);

  // Compute or validate initial position whenever selectedFeature opens or window resizes
  useEffect(() => {
    if (!selectedFeature) return;

    const computeInitialPos = () => {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      // Fit panel dimensions to smaller viewports automatically
      const targetW = Math.min(size.width || 340, containerWidth - 16);
      const targetH = Math.min(size.height || 310, containerHeight - 80);

      const panelW = Math.max(Math.min(260, containerWidth - 16), targetW);
      const panelH = Math.max(Math.min(180, containerHeight - 80), targetH);

      // Default initial position
      let defaultLeft = 16;
      let defaultTop = 72;

      // On mobile screens, center horizontally
      if (containerWidth < 500) {
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
        // Keep existing user position within current safe viewport bounds
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
  if (!details) {
    return (
      <div
        ref={panelRef}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: `${currentLeft}px`,
          top: `${currentTop}px`,
          width: `${size.width}px`,
          zIndex: 35,
        }}
        className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-lg p-4 shadow-2xl text-slate-200 flex flex-col gap-2"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300">Country Details</span>
          <button onClick={handleClose} className="text-xs text-slate-400 hover:text-white p-1">✕</button>
        </div>
        <p className="text-xs text-slate-400 py-2">Country information is temporarily unavailable.</p>
      </div>
    );
  }

  const formatVal = (val, fallback = 'Data unavailable') => {
    if (!val || val === 'null' || val === 'undefined' || val === 'N/A' || val === 'Capital City' || val === 'Information unavailable') {
      return fallback;
    }
    return val;
  };

  const displayName = formatVal(details.name, 'Selected Territory');
  const displayCapital = formatVal(details.capital, 'Data unavailable');
  const displayRegion = formatVal(details.region || details.continent, 'Data unavailable');
  const displayContinent = formatVal(details.continent, 'Data unavailable');
  const displayPopulation = formatVal(details.population, 'Data unavailable');
  const displayArea = formatVal(details.area, 'Data unavailable');
  const displayCurrency = formatVal(details.currency, 'Data unavailable');
  const displayLanguage = formatVal(details.language, 'Data unavailable');

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

      const panelW = panelRef.current ? panelRef.current.offsetWidth : (size.width || 340);
      const panelH = panelRef.current ? panelRef.current.offsetHeight : (size.height || 310);

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

    const currentW = panelRef.current ? panelRef.current.offsetWidth : (size.width || 340);
    const currentH = panelRef.current ? panelRef.current.offsetHeight : (size.height || 310);

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

      const minW = 260;
      const minH = 180;
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
      className={`bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-lg p-4 shadow-2xl text-slate-200 flex flex-col relative overflow-hidden transition-all duration-150 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      } ${
        isDragging || isResizing ? 'select-none border-slate-700 !transition-none' : ''
      }`}
    >
      {/* Panel Header */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onTouchStart={handleHeaderPointerDown}
        className={`flex items-center justify-between pb-2.5 border-b border-slate-800 gap-2 select-none touch-none shrink-0 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Drag header to position window"
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
          <div className="w-7 h-5 rounded border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {details.flagUrl && !imgError ? (
              <img
                src={details.flagUrl}
                alt={`${details.name} flag`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs leading-none">{details.flagEmoji}</span>
            )}
          </div>

          {/* Title & Capital */}
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-slate-100 tracking-wide truncate">
              {displayName}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {details.officialName && details.officialName !== displayName
                ? details.officialName
                : (displayCapital !== 'Data unavailable' ? displayCapital : displayContinent)}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleClose}
          className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors rounded hover:bg-slate-800 cursor-pointer shrink-0 text-xs min-w-[28px] min-h-[28px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          title="Close window"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Structured Information List */}
      <div className="flex-1 overflow-y-auto mt-2.5 pr-1 text-xs space-y-2.5 font-sans custom-scrollbar">
        {/* Capital & Region Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2">
          {/* Capital & Coordinates */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Capital
            </span>
            <span className="text-slate-200 font-semibold truncate text-[11px]">
              {displayCapital}
            </span>
            {details.capitalLat !== undefined && details.capitalLon !== undefined && !isNaN(details.capitalLat) && !isNaN(details.capitalLon) && details.capitalLat !== 0 && (
              <span className="text-[9px] text-slate-400 font-mono leading-none truncate">
                {Math.abs(details.capitalLat).toFixed(1)}°{details.capitalLat >= 0 ? 'N' : 'S'}, {Math.abs(details.capitalLon).toFixed(1)}°{details.capitalLon >= 0 ? 'E' : 'W'}
              </span>
            )}
          </div>

          {/* Region & Continent */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Region
            </span>
            <span className="text-slate-200 font-semibold truncate text-[11px]">
              {displayRegion}
            </span>
            <span className="text-[9px] text-slate-400 font-mono leading-none truncate">
              {displayContinent}
            </span>
          </div>
        </div>

        {/* Population & Area Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2">
          {/* Population */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Population
            </span>
            <span className="text-slate-100 font-mono font-semibold text-[11px] truncate">
              {displayPopulation}
            </span>
          </div>

          {/* Area */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Area
            </span>
            <span className="text-slate-100 font-mono font-semibold text-[11px] truncate">
              {displayArea}
            </span>
          </div>
        </div>

        {/* Currency & Official Language Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2">
          {/* Currency */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Currency
            </span>
            <span className="text-slate-200 font-semibold text-[11px] truncate">
              {displayCurrency}
            </span>
          </div>

          {/* Official Language */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Language
            </span>
            <span className="text-slate-200 font-semibold text-[11px] truncate">
              {displayLanguage}
            </span>
          </div>
        </div>

        {/* Neighboring Countries */}
        {(() => {
          const neighbors = getNeighborFeatures(selectedFeature);
          return (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/80">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                Neighboring Countries ({neighbors.length})
              </span>
              {neighbors.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
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
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-[10px] text-sky-200/90 hover:text-sky-100 font-medium cursor-pointer transition-colors min-h-[28px] flex items-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                        title={`Select ${nName}`}
                        aria-label={`Select ${nName}`}
                      >
                        {nName}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-slate-400 text-[10px] italic">
                  None (Island or isolated territory)
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {/* Resize Handle Grip */}
      <div
        onPointerDown={handleResizePointerDown}
        onTouchStart={handleResizePointerDown}
        className="absolute bottom-0 right-0 w-7 h-7 sm:w-5 sm:h-5 flex items-end justify-end p-1 sm:p-0.5 cursor-nwse-resize select-none touch-none text-slate-600 hover:text-slate-400 transition-colors z-20"
        title="Drag corner to resize window"
      >
        <svg className="w-3.5 h-3.5 sm:w-3 sm:h-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 14H11V12H14V14ZM14 10H8V8H14V10ZM14 6H5V4H14V6Z" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}


