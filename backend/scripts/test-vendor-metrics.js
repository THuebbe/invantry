/**
 * Test script for vendor metrics endpoint
 * Usage: node backend/scripts/test-vendor-metrics.js
 */

import { supabase } from "../src/services/supabase.js";
import { getVendorMetrics } from "../src/services/metrics.js";

async function testVendorMetrics() {
	console.log("\n=== Testing Vendor Metrics Calculation ===\n");

	try {
		// Get the first restaurant for testing
		const { data: restaurants, error: restaurantError } = await supabase
			.from("restaurants")
			.select("id")
			.limit(1)
			.single();

		if (restaurantError || !restaurants) {
			console.error("❌ Error fetching restaurant:", restaurantError);
			return;
		}

		console.log(`Testing with restaurant ID: ${restaurants.id}\n`);

		// Test the metrics calculation
		const metrics = await getVendorMetrics(restaurants.id);

		console.log("✅ Vendor Metrics Calculation Success!\n");
		console.log("Metrics Results:");
		console.log("================");
		console.log(`Active Vendors Count: ${metrics.activeVendorsCount}`);
		console.log(`Average Lead Time: ${metrics.avgLeadTimeDays} days`);
		console.log(`Documents Expiring Soon: ${metrics.documentsExpiringSoon}`);
		console.log(`Grade A Vendors Count: ${metrics.gradeAVendorsCount}`);
		console.log("");

		// Additional debugging: check vendors table
		const { data: vendors, error: vendorsError } = await supabase
			.from("vendors")
			.select("id, name, is_active")
			.eq("restaurant_id", restaurants.id);

		if (vendorsError) {
			console.error("Error fetching vendors:", vendorsError);
		} else {
			console.log(`\nTotal vendors in database: ${vendors.length}`);
			console.log(`Active vendors: ${vendors.filter((v) => v.is_active === true).length}`);
		}

		// Check documents
		const { count: totalDocs, error: docsError } = await supabase
			.from("vendor_documents")
			.select("*", { count: "exact", head: true })
			.eq("restaurant_id", restaurants.id);

		if (docsError) {
			console.error("Error fetching documents:", docsError);
		} else {
			console.log(`\nTotal vendor documents: ${totalDocs || 0}`);
		}

		// Check scorecards
		const { count: totalScorecards, error: scoreError } = await supabase
			.from("vendor_scorecards")
			.select("*", { count: "exact", head: true })
			.eq("restaurant_id", restaurants.id);

		if (scoreError) {
			console.error("Error fetching scorecards:", scoreError);
		} else {
			console.log(`Total vendor scorecards: ${totalScorecards || 0}`);
		}

		console.log("\n=== Test Complete ===\n");
	} catch (error) {
		console.error("❌ Error during test:", error.message);
		console.error(error);
	}
}

// Run the test
testVendorMetrics();
