// QuickActionsBar.jsx - Mobile-only slim icon bar for quick actions
// Shows as a horizontal strip of icons, similar to bottom tab navigation

import { Link } from "react-router-dom";

export default function QuickActionsBar({ actions }) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div
        className="flex justify-around items-center px-2 py-2 overflow-x-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {actions.map((action) => {
          const Icon = action.icon;

          // Color mapping for icons
          const iconColors = {
            green: "text-green-600",
            red: "text-red-600",
            blue: "text-blue-600",
            purple: "text-purple-600",
          };

          return (
            <Link
              key={action.id}
              to={action.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors min-w-0"
            >
              <Icon
                size={20}
                className={iconColors[action.color] || "text-gray-600"}
              />
              <span className="text-[10px] text-gray-600 font-medium truncate max-w-[60px] text-center leading-tight">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
