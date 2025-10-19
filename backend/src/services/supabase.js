import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key - NEVER exposed!

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Reusable query function for backend
 */
export async function getData(table, options = {}) {
	const { filters = {}, select = "*", order = null, limit = null } = options;

	let query = supabase.from(table).select(select);

	// Apply filters
	Object.entries(filters).forEach(([key, value]) => {
		if (value === true || value === false) {
			query = query.eq(key, value);
		} else if (value !== null && value !== undefined) {
			query = query.eq(key, value);
		}
	});

	if (order) {
		query = query.order(order.column, { ascending: order.ascending ?? true });
	}

	if (limit) {
		query = query.limit(limit);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return data;
}
