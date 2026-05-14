// BarcodeScanner - Camera-based barcode/QR scanner overlay

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";

export default function BarcodeScanner({ onScan, onClose, title = "Scan Barcode", hint = "Point camera at a barcode or QR code" }) {
	const [error, setError] = useState(null);
	const [isStarting, setIsStarting] = useState(true);
	const scannerRef = useRef(null);
	const isRunningRef = useRef(false);
	const onScanRef = useRef(onScan);
	onScanRef.current = onScan;
	// Unique ID per mount so a lingering async stop() from a previous instance
	// can't find and inject into this mount's container element.
	const scannerIdRef = useRef(`barcode-scanner-${Date.now()}`);

	useEffect(() => {
		const scannerId = scannerIdRef.current;
		// `aborted` is set to true by the cleanup function. If StrictMode fires the
		// cleanup before scanner.start() resolves, this flag causes the async work to
		// self-cancel rather than injecting a second video element into the container.
		let aborted = false;

		// Clear any leftover DOM from a previous effect run
		const container = document.getElementById(scannerId);
		if (container) container.innerHTML = "";

		const startScanner = async () => {
			try {
				setIsStarting(true);
				setError(null);

				const scanner = new Html5Qrcode(scannerId);

				await scanner.start(
					{ facingMode: "environment" },
					{
						fps: 10,
						qrbox: { width: 250, height: 250 },
						aspectRatio: 1.0,
					},
					(decodedText) => {
						// Successful scan — stop scanner then fire callback
						isRunningRef.current = false;
						try { scanner.stop().catch(() => {}); } catch {}
						onScanRef.current(decodedText);
					},
					() => {
						// QR code scan failure (continuous, expected while scanning)
					}
				);

				// If cleanup ran while we were awaiting start(), stop immediately and bail
				if (aborted) {
					try { scanner.stop().catch(() => {}); } catch {}
					return;
				}

				scannerRef.current = scanner;
				isRunningRef.current = true;
				setIsStarting(false);
			} catch (err) {
				if (aborted) return;
				console.error("Scanner error:", err);
				isRunningRef.current = false;
				setIsStarting(false);

				if (typeof err === "string" && err.includes("Permission")) {
					setError("Camera permission denied. Please allow camera access and try again.");
				} else if (typeof err === "string" && err.includes("NotFoundError")) {
					setError("No camera found on this device.");
				} else if (err?.name === "NotReadableError" || (typeof err === "string" && err.includes("NotReadableError"))) {
					setError("Camera is already in use by another app. Close it and try again.");
				} else {
					setError(
						err?.message || err || "Unable to start camera. Please check permissions."
					);
				}
			}
		};

		startScanner();

		return () => {
			aborted = true;
			if (scannerRef.current && isRunningRef.current) {
				isRunningRef.current = false;
				try {
					scannerRef.current
						.stop()
						.then(() => { try { scannerRef.current?.clear(); } catch {} })
						.catch(() => {});
				} catch {
					// Scanner wasn't running — nothing to stop
				}
				scannerRef.current = null;
			}
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		// Backdrop — click anywhere outside the card to close
		<div
			className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto"
			onClick={onClose}
		>
			{/* Card — stop click propagation so the backdrop handler doesn't fire */}
			<div
				className="bg-white rounded-xl max-w-sm w-full my-8 flex-shrink-0"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header — always at the top of the card */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					<div className="flex items-center gap-2">
						<Camera size={20} className="text-purple-600" />
						<h3 className="font-semibold text-gray-900">{title}</h3>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X size={20} className="text-gray-500" />
					</button>
				</div>

				{/* Scanner content */}
				<div className="p-4">
					{isStarting && !error && (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent" />
							<span className="ml-3 text-sm text-gray-600">Starting camera...</span>
						</div>
					)}

					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
							<AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
							<div>
								<p className="text-sm text-red-700">{error}</p>
								<button
									onClick={onClose}
									className="mt-2 text-sm text-red-600 underline hover:text-red-800"
								>
									Close scanner
								</button>
							</div>
						</div>
					)}

					<div
						id={scannerIdRef.current}
						className={error ? "hidden" : "rounded-lg overflow-hidden"}
					/>

					{!error && !isStarting && (
						<p className="text-xs text-gray-500 text-center mt-3">
							{hint}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
