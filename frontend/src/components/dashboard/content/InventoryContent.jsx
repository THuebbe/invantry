// /frontend/src/components/dashboard/content/InventoryContent.jsx

import { useQuery } from "@tanstack/react-query";
import api from "../../../core/database/api";

export default function InventoryContent({ subsection }) {
	// Fetch inventory data
	const {
		data: inventory,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["inventory"],
		queryFn: async () => {
			const response = await api.get("/inventory");
			return response.data;
		},
		staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
	});

	// Filter based on subsection
	const getFilteredInventory = () => {
		if (!inventory) return [];

		switch (subsection) {
			case "low-stock":
				return inventory.filter(
					(item) => item.quantity <= (item.minimum_quantity || 0)
				);
			case "expiring": {
				const sevenDaysFromNow = new Date();
				sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
				return inventory.filter((item) => {
					if (!item.expiration_date) return false;
					const expirationDate = new Date(item.expiration_date);
					const today = new Date();
					return expirationDate >= today && expirationDate <= sevenDaysFromNow;
				});
			}
			case "add":
				return []; // Show add form instead
			default:
				return inventory;
		}
	};

	const filteredInventory = getFilteredInventory();

	// Get title based on subsection
	const getTitle = () => {
		switch (subsection) {
			case "low-stock":
				return "Low Stock Items";
			case "expiring":
				return "Items Expiring Soon";
			case "add":
				return "Add New Ingredient";
			default:
				return "All Ingredients";
		}
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading inventory...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (isError) {
		return (
			<div className="bg-white rounded-lg border border-red-200 p-12">
				<div className="text-center text-red-600">
					<p className="font-semibold text-lg mb-2">Failed to load inventory</p>
					<p className="text-sm">
						{error?.message || "Please try again later"}
					</p>
				</div>
			</div>
		);
	}

	// Add ingredient form (placeholder)
	if (subsection === "add") {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">{getTitle()}</h2>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
					<p className="text-blue-700">Add ingredient form coming soon!</p>
				</div>
			</div>
		);
	}

	// Inventory list
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
				<p className="text-sm text-gray-500">
					{filteredInventory.length} items
				</p>
			</div>

			{filteredInventory.length === 0 ? (
				<div className="flex-1 flex items-center justify-center">
					<p className="text-gray-500">No items found</p>
				</div>
			) : (
				<div className="overflow-y-auto flex-1">
					<div className="space-y-3">
						{filteredInventory.map((item) => (
							<InventoryCard
								key={item.id}
								item={item}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// Individual inventory item card
function InventoryCard({ item }) {
	const isLowStock = item.quantity <= (item.minimum_quantity || 0);

	// Calculate days until expiration
	const getDaysUntilExpiry = () => {
		if (!item.expiration_date) return null;
		const today = new Date();
		const expiration = new Date(item.expiration_date);
		const diffTime = expiration - today;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	const daysUntilExpiry = getDaysUntilExpiry();
	const isExpiringSoon =
		daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

	return (
		<div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="font-semibold text-gray-900 mb-1">
						{item.ingredient_name}
					</h3>
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
						<span>Category: {item.category}</span>
						<span>Location: {item.location}</span>
					</div>
				</div>

				<div className="text-right">
					<div className="text-2xl font-bold text-gray-900">
						{item.quantity}{" "}
						<span className="text-sm font-normal text-gray-500">
							{item.unit}
						</span>
					</div>
					{item.minimum_quantity && (
						<div className="text-xs text-gray-500">
							Min: {item.minimum_quantity} {item.unit}
						</div>
					)}
				</div>
			</div>

			{/* Alerts */}
			<div className="mt-3 flex gap-2">
				{isLowStock && (
					<span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
						⚠️ Low Stock
					</span>
				)}
				{isExpiringSoon && (
					<span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
						📅 Expires in {daysUntilExpiry} days
					</span>
				)}
			</div>

			{/* Additional info */}
			{item.expiration_date && (
				<div className="mt-2 text-xs text-gray-500">
					Expires: {new Date(item.expiration_date).toLocaleDateString()}
				</div>
			)}
		</div>
	);
}
