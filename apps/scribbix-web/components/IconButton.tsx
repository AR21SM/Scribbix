import { ReactNode } from "react";

export function IconButton({
  icon,
  onClick,
  activated,
  tooltip,
}: {
  icon: ReactNode;
  onClick: () => void;
  activated: boolean;
  tooltip?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all duration-200 relative group ${
        activated
          ? "bg-blue-600 text-white shadow-lg scale-105"
          : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
      title={tooltip}
    >
      {icon}
      {tooltip && (
        <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
          {tooltip}
        </span>
      )}
    </button>
  );
}
