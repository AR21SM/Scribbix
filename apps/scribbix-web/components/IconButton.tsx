import { ReactNode } from "react";

export function IconButton({
  icon,
  onClick,
  activated,
  tooltip,
  tooltipPlacement = "right",
}: {
  icon: ReactNode;
  onClick: () => void;
  activated: boolean;
  tooltip?: string;
  tooltipPlacement?: "right" | "bottom";
}) {
  const placementClasses =
    tooltipPlacement === "bottom"
      ? "top-full mt-2.5 left-1/2 -translate-x-1/2 origin-top"
      : "left-full ml-3 top-1/2 -translate-y-1/2 origin-left";

  return (
    <button
      onClick={onClick}
      aria-label={tooltip}
      type="button"
      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 relative group shrink-0 ${
        activated
          ? "bg-[#1769ff] text-white shadow-md shadow-blue-500/10 scale-[1.03]"
          : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
      }`}
    >
      <div className="size-[18px] flex items-center justify-center [&_svg]:size-full">
        {icon}
      </div>
      {tooltip && (
        <span className={`absolute ${placementClasses} px-2.5 py-1.5 bg-slate-950/90 border border-slate-800/30 text-white text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 shadow-lg shadow-slate-950/20 backdrop-blur-sm`}>
          {tooltip}
        </span>
      )}
    </button>
  );
}

