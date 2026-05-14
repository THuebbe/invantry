// Toast - Reusable inline notification/toast component
// Props:
//   type:     'success' | 'error' | 'warning' | 'info'  (default: 'info')
//   message:  string
//   onClose:  optional callback — renders an X button when provided
//   className: optional extra classes

import { Check, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const CONFIG = {
	success: {
		wrapper: "bg-green-50 border border-green-200 text-green-800",
		icon: <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" />,
	},
	error: {
		wrapper: "bg-red-50 border border-red-200 text-red-700",
		icon: <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />,
	},
	warning: {
		wrapper: "bg-amber-50 border border-amber-200 text-amber-800",
		icon: <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />,
	},
	info: {
		wrapper: "bg-blue-50 border border-blue-200 text-blue-800",
		icon: <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />,
	},
};

export default function Toast({ type = "info", message, onClose, className = "" }) {
	if (!message) return null;

	const { wrapper, icon } = CONFIG[type] || CONFIG.info;

	return (
		<div className={`rounded-lg p-3 flex items-start gap-2 text-sm ${wrapper} ${className}`}>
			{icon}
			<span className="flex-1">{message}</span>
			{onClose && (
				<button
					onClick={onClose}
					className="flex-shrink-0 ml-1 opacity-60 hover:opacity-100 transition-opacity"
					aria-label="Dismiss"
				>
					<X size={14} />
				</button>
			)}
		</div>
	);
}
