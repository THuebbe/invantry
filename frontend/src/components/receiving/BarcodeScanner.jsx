// BarcodeScanner - Camera-based barcode/QR scanner overlay

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";

export default function BarcodeScanner({ onScan, onClose }) {
	const [error, setError] = useState(null);
	const [isStarting, setIsStarting] = useState(true);
	const scannerRef = useRef(null);
	const containerRef = useRef(null);

	useEffect(() => {
		let scanner = null;

		const startScanner = async () => {
			try {
				setIsStarting(true);
				setError(null);

				scanner = new Html5Qrcode("barcode-scanner-container");
				scannerRef.current = scanner;

				await scanner.start(
					{ facingMode: "environment" },
					{
						fps: 10,
						qrbox: { width: 250, height: 250 },
						aspectRatio: 1.0,
					},
					(decodedText) => {
						// Successful scan
						scanner.stop().catch(console.error);
						onScan(decodedText);
					},
					() => {
						// QR code scan failure (continuous, expected while scanning)
					}
				);

				setIsStarting(false);
			} catch (err) {
				console.error("Scanner error:", err);
				setIsStarting(false);

				if (typeof err === "string" && err.includes("Permission")) {
					setError("Camera permission denied. Please allow camera access and try again.");
				} else if (typeof err === "string" && err.includes("NotFoundError")) {
					setError("No camera found on this device.");
				} else {
					setError(
						err?.message || err || "Unable to start camera. Please check permissions."
					);
				}
			}
		};

		startScanner();

		return () => {
			if (scannerRef.current) {
				scannerRef.current
					.stop()
					.then(() => scannerRef.current.clear())
					.catch(() => {});
			}
		};
	}, [onScan]);

	return (
		<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
			<div className="bg-white rounded-xl max-w-sm w-full overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					<div className="flex items-center gap-2">
						<Camera size={20} className="text-purple-600" />
						<h3 className="font-semibold text-gray-900">Scan PO Barcode</h3>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X size={20} className="text-gray-500" />
					</button>
				</div>

				{/* Scanner */}
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
						id="barcode-scanner-container"
						ref={containerRef}
						className={error ? "hidden" : "rounded-lg overflow-hidden"}
					/>

					{!error && !isStarting && (
						<p className="text-xs text-gray-500 text-center mt-3">
							Point camera at a barcode or QR code on your PO
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
