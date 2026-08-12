import React from 'react';

/**
 * Geographic Globe Navigation Controls
 * Compact, dark vertical toolbar for Zoom In (+), Zoom Out (-),
 * Center/Reset View, Clear Selection, and Keyboard Shortcuts Help.
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
      className="flex flex-col gap-1 p-1 bg-slate-950/85 border border-slate-800/80 rounded-xl backdrop-blur-md shadow-2xl select-none font-sans"
      onPointerDown={stopProp}
      onTouchStart={stopProp}
      onClick={stopProp}
    >
      {/* Zoom In */}
      <button
        type="button"
        onClick={onZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer focus-visible:outline-none"
        title="Zoom In (+)"
        aria-label="Zoom In"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={onZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer focus-visible:outline-none"
        title="Zoom Out (-)"
        aria-label="Zoom Out"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
        </svg>
      </button>

      <div className="h-px bg-slate-800/80 mx-1 my-0.5" />

      {/* Center Pakistan / Reset View */}
      <button
        type="button"
        onClick={onResetView}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer focus-visible:outline-none"
        title="Center / Reset View (R)"
        aria-label="Center / Reset View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="1.8" />
          <path strokeLinecap="round" strokeWidth="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
      </button>

      {/* Clear Selection */}
      {hasSelection && (
        <button
          type="button"
          onClick={onClearSelection}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer focus-visible:outline-none"
          title="Clear Country Selection (Esc)"
          aria-label="Clear Country Selection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Keyboard Shortcuts Modal Toggle */}
      {onToggleShortcuts && (
        <button
          type="button"
          onClick={onToggleShortcuts}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer focus-visible:outline-none"
          title="Keyboard Shortcuts"
          aria-label="Keyboard Shortcuts"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}
