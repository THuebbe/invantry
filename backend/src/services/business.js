import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function createBusiness(businessData, userId) {
	try {
		let slug = generateSlug(businessData.name);

		const { data: existingBusiness } = await supabase
			.from("businesses")
			.select("slug, address")
			.eq("slug", slug)
			.maybeSingle();

		if (existingBusiness) {
			if (existingBusiness.address === businessData.address) {
				throw new Error("This business is already registered at this address");
			}

			slug = `${slug}-${generateSlug(businessData.city)}`;

			const { data: withCity } = await supabase
				.from("businesses")
				.select("slug")
				.eq("slug", slug)
				.maybeSingle();

			if (withCity) {
				const streetNumber = businessData.address.split(" ")[0];
				slug = `${slug}-${streetNumber}`;
			}
		}

		const { data, error } = await supabase
			.from("businesses")
			.insert({
				name: businessData.name.trim(),
				slug: slug,
				domain: businessData.domain.trim(),
				address: businessData.address.trim(),
				city: businessData.city.trim(),
				business_type: "restaurant",
				is_active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (error) throw new Error(`Business creation failed: ${error.message}`);

		const { error: userUpdateError } = await supabase
			.from("users")
			.update({
				businessId: data.id,
				updatedAt: new Date().toISOString(),
			})
			.eq("id", userId);

		if (userUpdateError) {
			throw new Error(`User update failed: ${userUpdateError.message}`);
		}

		return {
			business: data,
			message: "Business successfully registered",
		};
	} catch (error) {
		throw error;
	}
}

function generateSlug(businessString) {
	const slug = businessString
		.toLowerCase()
		.replace(/'/g, "")
		.replace(/[^\w-]+/g, "")
		.replace(/\s+/g, "-")
		.replace(/--+/g, "-")
		.trim();

	return slug;
}
