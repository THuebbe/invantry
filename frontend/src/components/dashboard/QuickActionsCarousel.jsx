import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import QuickActionCard from "./QuickActionCard";

export default function QuickActionsCarousel({ actions }) {
	const scrollContainerRef = useRef(null);

	const scroll = (direction) => {
		const container = scrollContainerRef.current;
		if (container) {
			const scrollAmount = container.clientWidth * 0.75; // Scroll 3/4 of visible width
			container.scrollBy({
				left: direction === "left" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
		}
	};

	return (
		<div className="relative">
			{/* Scroll buttons - hidden on mobile */}
			<button
				onClick={() => scroll("left")}
				className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center hover:bg-gray-50 hidden md:flex"
			>
				<ChevronLeft size={16} />
			</button>

			<button
				onClick={() => scroll("right")}
				className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center hover:bg-gray-50 hidden md:flex"
			>
				<ChevronRight size={16} />
			</button>

			{/* Scrollable container */}
			<div
				ref={scrollContainerRef}
				className="flex w-full gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
				style={{
					scrollbarWidth: "none", // Firefox
					msOverflowStyle: "none", // IE/Edge
				}}
			>
				{actions.map((action) => (
					<div
						key={action.id}
						className="flex-1 w-full max-w-xs snap-start"
					>
						<QuickActionCard action={action} />
					</div>
				))}
			</div>
		</div>
	);
}
