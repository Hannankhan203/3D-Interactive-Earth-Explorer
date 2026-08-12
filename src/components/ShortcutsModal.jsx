import React, { useEffect } from 'react';

/**
 * Keyboard Shortcuts Modal
 * Displays list of keyboard shortcuts available in Earth Explorer.
 */
export default function ShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: 'Left Click + Drag', desc: 'Rotate the 3D Earth globe' },
    { key: 'Scroll Wheel / Pinch', desc: 'Zoom in and out of Earth surface' },
    { key: 'Right Click + Drag', desc: 'Pan camera view' },
    { key: 'Hover Country', desc: 'Display quick country name & capital badge' },
    { key: 'Click Country', desc: 'Select country and open detailed info panel' },
    { key: '/', desc: 'Focus Country Search input bar' },
    { key: 'R', desc: 'Reset camera view (Default position)' },
    { key: 'Esc', desc: 'Close active panel, search results, or modal' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-950/95 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-xl text-slate-200 space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">⌨️</span>
            <h3 className="text-sm font-bold text-slate-100">
              Earth Explorer Shortcuts & Navigation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 text-xs transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Shortcuts Table */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 text-xs font-sans custom-scrollbar">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80"
            >
              <span className="text-slate-300 text-xs">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-cyan-300 font-medium shrink-0 ml-3">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
