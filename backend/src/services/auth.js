// /backend/src/services/auth.js

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("Supabase URL:", supabaseUrl);
console.log("Service Key loaded:", supabaseServiceKey ? "Yes" : "No");

export async function registerUser(email, password, metadata) {
	try {
		// Step 1: Create the user with admin API
		const { data, error } = await supabase.auth.admin.createUser({
			email: email,
			password: password,
			email_confirm: true,
			user_metadata: {
				firstName: metadata.firstName || "",
				lastName: metadata.lastName || "",
			},
		});

		if (error) throw new Error(`Auth creation failed: ${error.message}`);

		// Step 2: Insert into users table - using camelCase to match schema
		const { error: dbError } = await supabase.from("users").insert({
			id: data.user.id,
			email: data.user.email,
			firstName: metadata.firstName,
			lastName: metadata.lastName,
			role: metadata.role || "MANAGER",
			businessId: metadata.businessId || null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		if (dbError)
			throw new Error(`Database user creation failed: ${dbError.message}`);

		// Step 3: Sign the user in to get a session/token
		const { data: sessionData, error: signInError } =
			await supabase.auth.signInWithPassword({
				email: email,
				password: password,
			});

		if (signInError) throw new Error(`Sign in failed: ${signInError.message}`);

		// Step 4: Get full user details from users table
		const { data: userDetails, error: userError } = await supabase
			.from("users")
			.select("*")
			.eq("id", data.user.id)
			.single();

		if (userError)
			throw new Error(`Failed to fetch user details: ${userError.message}`);

		return {
			user: sessionData.user,
			session: sessionData.session,
			userDetails: userDetails,
			accessToken: sessionData.session.access_token, // 👈 THIS IS THE KEY!
			message: "User successfully registered",
		};
	} catch (error) {
		throw error;
	}
}

export async function loginUser(email, password) {
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email: email,
			password: password,
		});

		if (error) throw new Error(`Login failed: ${error.message}`);

		// Get user details from users table (camelCase)
		// Join with businesses table (snake_case)
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("*") // Join uses relationship name
			.eq("id", data.user.id)
			.single();

		if (userError) {
			console.warn("Could not fetch user details:", userError);
		}

		return {
			user: data.user,
			session: data.session,
			userDetails: userData,
			accessToken: data.session.access_token,
		};
	} catch (error) {
		throw error;
	}
}

export async function verifyToken(token) {
	try {
		if (!token) {
			throw new Error("No token provided");
		}

		const cleanToken = token.replace("Bearer ", "");

		const { data, error } = await supabase.auth.getUser(cleanToken);

		if (error) {
			throw new Error(`Token verification failed: ${error.message}`);
		}

		// Get user from users table (camelCase columns)
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("*")
			.eq("id", data.user.id)
			.single();

		if (userError) {
			throw new Error(`User lookup failed: ${userError.message}`);
		}

		return {
			user: data.user,
			userDetails: userData,
			businessId: userData.businessId, // camelCase
			role: userData.role,
		};
	} catch (error) {
		throw error;
	}
}

export async function logoutUser(token) {
	try {
		const cleanToken = token.replace("Bearer ", "");

		const { error } = await supabase.auth.admin.signOut(cleanToken);

		if (error) {
			throw new Error(`Logout failed: ${error.message}`);
		}

		return { message: "Logged out successfully" };
	} catch (error) {
		throw error;
	}
}

export async function resetPassword(email) {
	try {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
		});

		if (error) {
			throw new Error(`Password reset failed: ${error.message}`);
		}

		return { message: "Password reset email sent" };
	} catch (error) {
		throw error;
	}
}

export async function updateUser(userId, updates) {
	try {
		if (
			updates.email ||
			updates.password ||
			updates.firstName ||
			updates.lastName
		) {
			const authUpdates = {};

			if (updates.email) authUpdates.email = updates.email;
			if (updates.password) authUpdates.password = updates.password;

			if (updates.firstName || updates.lastName) {
				authUpdates.data = {
					firstName: updates.firstName,
					lastName: updates.lastName,
				};
			}
			const { error: authError } = await supabase.auth.admin.updateUserById(
				userId,
				authUpdates
			);
			if (authError) {
				throw new Error(`Auth update failed: ${authError.message}`);
			}
		}

		// Update users table (camelCase columns)
		const { data, error } = await supabase
			.from("users")
			.update({
				firstName: updates.firstName,
				lastName: updates.lastName,
				role: updates.role,
				businessId: updates.businessId,
				updatedAt: new Date().toISOString(),
			})
			.eq("id", userId)
			.select()
			.single();

		if (error) {
			throw new Error(`User update failed: ${error.message}`);
		}

		return data;
	} catch (error) {
		throw error;
	}
}
