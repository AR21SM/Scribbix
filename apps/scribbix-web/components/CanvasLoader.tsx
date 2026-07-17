"use client";

import { BrandLogo } from "./BrandLogo";

export function CanvasLoader() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#121214] overflow-hidden transition-colors duration-300"
    >
      {/* Self-contained CSS keyframe animation for the loading sweep */}
      <style>{`
        @keyframes loadingSweep {
          0% { left: -35%; width: 35%; }
          50% { left: 30%; width: 50%; }
          100% { left: 100%; width: 35%; }
        }
      `}</style>

      {/* Soft ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col items-center select-none w-full max-w-xs px-6">
        {/* Brand logo */}
        <div className="mb-6 scale-[1.05]">
          <BrandLogo href="#" className="pointer-events-none" />
        </div>

        {/* Minimal Indeterminate Progress Bar */}
        <div className="relative h-[2px] w-20 bg-slate-200/50 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-amber-500 rounded-full"
            style={{
              animation: "loadingSweep 1.4s infinite ease-in-out",
            }}
          />
        </div>
      </div>
    </main>
  );
}
