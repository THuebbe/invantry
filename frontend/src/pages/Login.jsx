// /frontend/src/pages/Login.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../core/auth/useAuth";

export default function Login() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const isFormValid = () => {
		return formData.email.length > 0 && formData.password.length > 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!isFormValid()) return;

		setIsLoading(true);
		setError(null);

		try {
			await login(formData.email, formData.password);
			navigate("/dashboard");
		} catch (err) {
			setError(err.response?.data?.error || "Invalid email or password");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-lg shadow-md p-8">
					{/* Logo/Brand */}
					<div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
						RI
					</div>

					<h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
						Welcome Back
					</h2>
					<p className="text-gray-600 text-center mb-6">
						Sign in to manage your restaurant inventory
					</p>

					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
							{error}
						</div>
					)}

					<form
						onSubmit={handleSubmit}
						className="space-y-4"
					>
						{/* Email */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email Address
							</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								placeholder="Enter your email"
								disabled={isLoading}
								autoComplete="email"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>

						{/* Password */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Password
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									name="password"
									value={formData.password}
									onChange={handleInputChange}
									placeholder="Enter your password"
									disabled={isLoading}
									autoComplete="current-password"
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									disabled={isLoading}
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>

						{/* Forgot Password Link */}
						<div className="text-right">
							<a
								href="#"
								className="text-sm text-green-600 hover:text-green-700"
							>
								Forgot password?
							</a>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={!isFormValid() || isLoading}
							className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
								isFormValid() && !isLoading
									? "bg-green-600 hover:bg-green-700 cursor-pointer"
									: "bg-gray-300 cursor-not-allowed"
							}`}
						>
							{isLoading ? (
								<span className="flex items-center justify-center gap-2">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Signing In...
								</span>
							) : (
								"Sign In"
							)}
						</button>
					</form>

					{/* Register Link */}
					<div className="mt-6 text-center">
						<Link
							to="/register"
							className="text-green-600 hover:text-green-700 text-sm"
						>
							Don't have an account? Create one
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
