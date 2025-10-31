// /frontend/src/core/auth/AuthContext.jsx

import { createContext, useState, useEffect } from "react";
import api from "../database/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// Check if user is logged in on mount
	useEffect(() => {
		const token = localStorage.getItem("auth_token");
		if (token) {
			fetchCurrentUser();
		} else {
			setLoading(false);
		}
	}, []);

	const fetchCurrentUser = async () => {
		try {
			const response = await api.get("/auth/me");
			setUser(response.data.userDetails);
		} catch (error) {
			console.error("Failed to fetch user:", error);
			localStorage.removeItem("auth_token");
		} finally {
			setLoading(false);
		}
	};

	const register = async (userData) => {
		const response = await api.post("/auth/register", userData);
		localStorage.setItem("auth_token", response.data.accessToken);
		setUser(response.data.userDetails);
		return response.data;
	};

	const createBusiness = async (businessData) => {
		const response = await api.post("/business/create", businessData);
		// Refresh user data to get updated businessId
		await fetchCurrentUser();
		return response.data;
	};

	const login = async (email, password) => {
		const response = await api.post("/auth/login", { email, password });
		localStorage.setItem("auth_token", response.data.accessToken);
		setUser(response.data.userDetails);
		return response.data;
	};

	const logout = async () => {
		try {
			await api.post("/auth/logout");
		} catch (error) {
			console.error("Logoug error:", error);
		} finally {
			localStorage.removeItem("auth_token");
			setUser(null);
		}
	};

	const value = {
		user,
		loading,
		register,
		createBusiness,
		login,
		logout,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
