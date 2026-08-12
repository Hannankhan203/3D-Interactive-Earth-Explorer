import { useState, useEffect } from 'react';

/**
 * Spatial Telemetry Guidance Hint
 * Rebuilt interaction hint for first-time operators.
 */
export default function NavHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 8000);

    const handlePointerDown = () => {
      setVisible(false);
    };

    window.addEventListener('pointerdown', handlePointerDown, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-12 left-4 z-30 pointer-events-auto transition-opacity duration-300 font-mono"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#020617]/90 border border-cyan-500/30 rounded shadow-xl backdrop-blur-md text-[10px] text-slate-300 relative">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-sans">DRAG TO ROTATE &bull; SCROLL / PINCH TO ZOOM</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-1 text-slate-500 hover:text-slate-300 transition-colors"
          title="Dismiss guidance"
          aria-label="Dismiss guidance"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
