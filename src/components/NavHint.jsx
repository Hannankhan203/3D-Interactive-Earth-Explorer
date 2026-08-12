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
      className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-[calc(0.75rem+env(safe-area-inset-left))] z-30 pointer-events-auto transition-opacity duration-300 font-mono max-w-[calc(100vw-80px)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#020617]/90 border border-cyan-500/30 rounded shadow-xl backdrop-blur-md text-[9px] sm:text-[10px] text-slate-300 relative">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
        <span className="font-sans truncate">DRAG TO ROTATE &bull; SCROLL / PINCH TO ZOOM</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-1 text-slate-500 hover:text-slate-300 transition-colors shrink-0 p-1"
          title="Dismiss guidance"
          aria-label="Dismiss guidance"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
