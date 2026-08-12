import { useEffect } from 'react';

/**
 * Technical Shortcuts & Control Matrix
 * Rebuilt dialog modal detailing navigation controls and hotkeys.
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
    { key: 'Left Click + Drag', desc: 'Rotate the 3D Earth planet' },
    { key: 'Scroll Wheel / Pinch', desc: 'Zoom camera in and out of Earth surface' },
    { key: 'Right Click + Drag', desc: 'Pan camera view' },
    { key: 'Hover Territory', desc: 'Display spatial country badge & capital' },
    { key: 'Click Territory', desc: 'Select territory and open geographic dossier' },
    { key: '/', desc: 'Trigger Spatial Target Finder Console' },
    { key: 'R', desc: 'Reset orbit camera to default center view' },
    { key: 'Esc', desc: 'Close active dossier, target finder, or modal' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 font-mono"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#020617]/95 border border-cyan-500/40 rounded-lg p-5 shadow-[0_0_40px_rgba(6,182,212,0.2)] backdrop-blur-2xl text-slate-200 space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Bracket Accents */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-cyan-400" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-cyan-400" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-cyan-400" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-cyan-400" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">⌨️</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              INSTRUMENT CONTROL MATRIX
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

        {/* Shortcuts Matrix Table */}
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 text-xs custom-scrollbar">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2 rounded bg-[#01040f]/80 border border-slate-800/80"
            >
              <span className="text-slate-300 font-sans text-xs">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-cyan-950 border border-cyan-800/80 rounded text-[10px] text-cyan-300 font-semibold shrink-0 ml-3">
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
            className="px-4 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
}
