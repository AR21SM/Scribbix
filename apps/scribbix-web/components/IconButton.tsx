import { ReactNode } from "react";

export function IconButton({
    icon, 
    onClick, 
    activated,
    tooltip
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
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title={tooltip}
        >
            {icon}
            {tooltip && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {tooltip}
                </span>
            )}
        </button>
    );
}


