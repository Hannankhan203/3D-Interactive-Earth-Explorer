import React, { useState, useRef, useEffect } from 'react';
import { getCountryDetails } from '../data/countryData';

/**
 * Clean, professional, compact information panel displaying basic geographic info.
 * Styled to seamlessly integrate with the project's high-tech / sci-fi HUD theme.
 * Features stable drag-to-move header and resizable bottom-right corner.
 */
export default function CountryInfoPanel({ selectedFeature, onClose }) {
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

      const panelW = size.width || 340;
      const panelH = size.height || 310;

      // Default initial position: below top search bar at top-left
      let defaultLeft = 16;
      let defaultTop = 72;

      // On narrow mobile screens, center horizontally
      if (containerWidth < 480) {
        defaultLeft = Math.max(8, (containerWidth - panelW) / 2);
        defaultTop = 64;
      }

      // Clamp coordinates strictly within viewport bounds with 10px margin
      const safeMinX = 10;
      const safeMaxX = Math.max(safeMinX, containerWidth - panelW - 10);
      const safeMinY = 10;
      const safeMaxY = Math.max(safeMinY, containerHeight - panelH - 10);

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
    return () => window.removeEventListener('resize', computeInitialPos);
  }, [selectedFeature, size.width, size.height]);

  if (!selectedFeature) return null;

  const details = getCountryDetails(selectedFeature);
  if (!details) return null;

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
      className={`bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3.5 sm:p-4 shadow-2xl shadow-cyan-950/50 text-slate-200 flex flex-col relative overflow-hidden transition-all duration-200 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
      } ${
        isDragging || isResizing ? 'select-none shadow-[0_0_25px_rgba(6,182,212,0.3)] !transition-none' : ''
      }`}
    >
      {/* Header Handle */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onTouchStart={handleHeaderPointerDown}
        className={`flex items-center justify-between pb-2.5 border-b border-white/10 gap-2 select-none touch-none shrink-0 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Click and drag to move panel"
      >
        <div className="flex items-center gap-2.5 overflow-hidden pointer-events-none">
          <div className="w-9 h-6.5 rounded border border-white/20 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {details.flagUrl && !imgError ? (
              <img
                src={details.flagUrl}
                alt={`${details.name} flag`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-lg leading-none">{details.flagEmoji}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-cyan-400 tracking-wider uppercase font-semibold">
                GEOGRAPHIC DATA
              </span>
              <span className="text-[9px] text-slate-500 font-mono">⋮⋮ drag</span>
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide truncate">
              {details.name}
            </h2>
          </div>
        </div>

        <button
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleClose}
          className="w-6.5 h-6.5 rounded-lg bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:text-cyan-300 text-slate-400 flex items-center justify-center transition-colors cursor-pointer shrink-0 text-xs"
          title="Close panel"
          aria-label="Close country information panel"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto pr-0.5 mt-2.5 text-xs space-y-2 custom-scrollbar">
        <div className="grid grid-cols-2 gap-2">
          {/* Capital City */}
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-2 flex flex-col col-span-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Capital City
              </span>
              {details.capitalLat !== undefined && details.capitalLon !== undefined && details.capitalLat !== 0 && (
                <span className="text-[9px] font-mono text-cyan-300/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {Math.abs(details.capitalLat).toFixed(2)}°{details.capitalLat >= 0 ? 'N' : 'S'}, {Math.abs(details.capitalLon).toFixed(2)}°{details.capitalLon >= 0 ? 'E' : 'W'}
                </span>
              )}
            </div>
            <span className="font-bold text-slate-100 text-xs sm:text-sm truncate mt-0.5 tracking-wide">
              {details.capital}
            </span>
          </div>

          {/* Continent */}
          <div className="bg-slate-900/60 border border-white/5 rounded-lg p-2 flex flex-col min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Continent
            </span>
            <span className="font-medium text-slate-100 truncate mt-0.5 text-[11px]" title={details.continent}>
              {details.continent}
            </span>
          </div>

          {/* Region */}
          <div className="bg-slate-900/60 border border-white/5 rounded-lg p-2 flex flex-col min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Region
            </span>
            <span className="font-medium text-slate-100 truncate mt-0.5 text-[11px]" title={details.region}>
              {details.region || 'N/A'}
            </span>
          </div>

          {/* Population */}
          <div className="bg-slate-900/60 border border-white/5 rounded-lg p-2 flex flex-col min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Population
            </span>
            <span className="font-medium text-cyan-300 font-mono truncate mt-0.5 text-[11px]">
              {details.population}
            </span>
          </div>

          {/* Area */}
          <div className="bg-slate-900/60 border border-white/5 rounded-lg p-2 flex flex-col min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Area
            </span>
            <span className="font-medium text-slate-100 font-mono truncate mt-0.5 text-[11px]">
              {details.area}
            </span>
          </div>

          {/* Currency */}
          <div className="bg-slate-900/60 border border-white/5 rounded-lg p-2 flex flex-col min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Currency
            </span>
            <span className="font-medium text-slate-100 truncate mt-0.5 text-[11px]">
              {details.currency}
            </span>
          </div>

          {/* Official Language */}
          <div className="bg-slate-900/60 border border-white/5 rounded-lg p-2 flex flex-col col-span-2 min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Official Language
            </span>
            <span className="font-medium text-slate-100 truncate mt-0.5 text-[11px]">
              {details.language}
            </span>
          </div>
        </div>
      </div>

      {/* Resize Handle (Bottom-Right) */}
      <div
        onPointerDown={handleResizePointerDown}
        onTouchStart={handleResizePointerDown}
        className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-1 cursor-nwse-resize select-none touch-none text-cyan-400/50 hover:text-cyan-300 transition-colors z-20"
        title="Drag corner to resize panel"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 14H11V12H14V14ZM14 10H8V8H14V10ZM14 6H5V4H14V6Z" opacity="0.85" />
        </svg>
      </div>
    </div>
  );
}


