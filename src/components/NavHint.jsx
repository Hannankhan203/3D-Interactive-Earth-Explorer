import React, { useState, useEffect } from 'react';

/**
 * First-Time User Navigation Hint
 * Displays a subtle, non-intrusive floating hint at the bottom left.
 * Automatically fades out after 8 seconds or when dismissed.
 */
export default function NavHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 8000);

    // Dismiss on user interaction with globe
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
      className="fixed bottom-12 left-4 z-30 pointer-events-auto transition-opacity duration-300 font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/85 border border-slate-800/80 rounded-lg shadow-xl backdrop-blur-md text-[11px] text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Drag to rotate &bull; Scroll or pinch to zoom</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-1 text-slate-500 hover:text-slate-300 transition-colors"
          title="Dismiss navigation help"
          aria-label="Dismiss navigation help"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
