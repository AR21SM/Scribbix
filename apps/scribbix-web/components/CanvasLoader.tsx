"use client";

export function CanvasLoader() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0e0e10] overflow-hidden"
    >
      <style>{`
        @keyframes sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes logo-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
          opacity: 0.55,
        }}
      />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[260px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(251,191,36,0.10) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative flex flex-col items-center gap-5 select-none"
        style={{ animation: "logo-in 0.5s ease-out both" }}
      >
        <div className="flex items-center text-[2.1rem] font-bold tracking-tight text-[#0a1128] dark:text-white leading-none">
          <span>Skribbi</span>
          <span className="relative">
            x
            <svg
              aria-hidden="true"
              className="absolute text-[#f59e0b]"
              style={{
                width: "0.52em",
                height: "0.52em",
                top: "-0.42em",
                right: "-0.54em",
                transform: "rotate(15deg)",
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            >
              <path d="M6 18 L3 12" />
              <path d="M12 16 L12 9" />
              <path d="M16 18 L20 14" />
            </svg>
          </span>
        </div>

        <div className="w-[120px] h-[2px] rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full w-1/2 rounded-full bg-[#f59e0b]"
            style={{ animation: "sweep 2.2s ease-in-out infinite" }}
          />
        </div>

        <p className="text-[11px] font-medium tracking-widest uppercase text-slate-400 dark:text-zinc-600">
          Loading canvas
        </p>
      </div>
    </main>
  );
}
