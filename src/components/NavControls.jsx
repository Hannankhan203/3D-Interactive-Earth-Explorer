import React from 'react';

/**
 * Orbital Camera Gimbal & Instrument Controls
 * Complete UI rebuild: Precision scope navigation toolbar for Zoom In (+), Zoom Out (-),
 * Center / Reset View (R), Clear Selection (Esc), and Keyboard Matrix (?).
 */
export default function NavControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onClearSelection,
  onToggleShortcuts,
  hasSelection,
}) {
  const stopProp = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="flex flex-col gap-1.5 p-1.5 bg-[#020617]/90 border border-cyan-500/30 rounded-lg shadow-[0_0_25px_rgba(2,132,199,0.15)] backdrop-blur-md select-none font-mono relative"
      onPointerDown={stopProp}
      onTouchStart={stopProp}
      onClick={stopProp}
    >
      {/* Tactical Brackets */}
      <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-cyan-400/80 pointer-events-none" />
      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-cyan-400/80 pointer-events-none" />
      <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-cyan-400/80 pointer-events-none" />
      <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-cyan-400/80 pointer-events-none" />

      {/* Zoom In */}
      <button
        type="button"
        onClick={onZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded bg-slate-900/60 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-700/80 transition-all cursor-pointer focus-visible:outline-none"
        title="Zoom In Camera (+)"
        aria-label="Zoom In Camera"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={onZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded bg-slate-900/60 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-700/80 transition-all cursor-pointer focus-visible:outline-none"
        title="Zoom Out Camera (-)"
        aria-label="Zoom Out Camera"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
        </svg>
      </button>

      <div className="h-px bg-cyan-900/40 my-0.5" />

      {/* Center / Reset View */}
      <button
        type="button"
        onClick={onResetView}
        className="w-8 h-8 flex items-center justify-center rounded bg-slate-900/60 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-200 border border-slate-800 hover:border-cyan-700/80 transition-all cursor-pointer focus-visible:outline-none"
        title="Reset Orbit & Center Pakistan (R)"
        aria-label="Reset Orbit & Center Pakistan"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="1.5" strokeDasharray="3 3" />
          <path strokeLinecap="round" strokeWidth="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
      </button>

      {/* Clear Selection */}
      {hasSelection && (
        <button
          type="button"
          onClick={onClearSelection}
          className="w-8 h-8 flex items-center justify-center rounded bg-amber-950/60 hover:bg-amber-900 text-amber-400 hover:text-amber-200 border border-amber-800 transition-all cursor-pointer focus-visible:outline-none"
          title="Clear Target Selection (Esc)"
          aria-label="Clear Target Selection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Keyboard Matrix Help */}
      {onToggleShortcuts && (
        <button
          type="button"
          onClick={onToggleShortcuts}
          className="w-8 h-8 flex items-center justify-center rounded bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all cursor-pointer focus-visible:outline-none"
          title="Control Shortcuts Matrix"
          aria-label="Control Shortcuts Matrix"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}
