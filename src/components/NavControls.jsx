import React from 'react';

/**
 * Minimal Geographic Navigation Controls
 * A compact, visually quiet vertical control bar for Zoom In, Zoom Out,
 * Center Pakistan / Reset View, and Clear Selection.
 */
export default function NavControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onClearSelection,
  hasSelection,
}) {
  const stopProp = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="absolute bottom-10 right-4 z-30 flex flex-col gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-lg backdrop-blur-md shadow-xl select-none"
      onPointerDown={stopProp}
      onTouchStart={stopProp}
      onClick={stopProp}
    >
      {/* Zoom In */}
      <button
        type="button"
        onClick={onZoomIn}
        className="w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer"
        title="Zoom In (+)"
        aria-label="Zoom In"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={onZoomOut}
        className="w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer"
        title="Zoom Out (-)"
        aria-label="Zoom Out"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
        </svg>
      </button>

      <div className="h-px bg-slate-800/80 mx-1 my-0.5" />

      {/* Center Pakistan / Reset View */}
      <button
        type="button"
        onClick={onResetView}
        className="w-7 h-7 flex items-center justify-center rounded text-sky-400 hover:text-sky-300 hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer"
        title="Center Pakistan / Reset View"
        aria-label="Center Pakistan / Reset View"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="1.8" />
          <path strokeLinecap="round" strokeWidth="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
      </button>

      {/* Clear Selection (shown when a country is selected) */}
      {hasSelection && (
        <button
          type="button"
          onClick={onClearSelection}
          className="w-7 h-7 flex items-center justify-center rounded text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer"
          title="Clear Selection"
          aria-label="Clear Selection"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
