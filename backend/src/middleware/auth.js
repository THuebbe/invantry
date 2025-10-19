import { verifyToken } from "../services/auth.js";

export async function requireAuth(req, res, next) {
	try {
		const token = req.headers.authorization;

		if (!token) {
			return res.status(401).json({ error: "Access token required" });
		}

		// Verify the token and get user info
		const authData = await verifyToken(token);

		// Add user info to request object for route handlers to use
		req.user = authData.user;
		req.userDetails = authData.userDetails;
		req.businessId = authData.businessId;
		req.userRole = authData.role;

		next(); // Continue to the route handler
	} catch (error) {
		return res.status(401).json({ error: error.message });
	}
}

export function requireRole(allowedRoles) {
	return async (req, res, next) => {
		if (!req.userRole) {
			return res.status(401).json({ error: "Authentication required" });
		}

		if (!allowedRoles.includes(req.userRole)) {
			return res.status(403).json({ error: "Insufficient permissions" });
		}

		next();
	};
}

export function requireBusinessAccess(req, res, next) {
	const requestedBusinessId = req.params.businessId || req.params.restaurant_id;

	if (!requestedBusinessId) {
		return res.status(400).json({ error: "Business ID required" });
	}

	if (req.businessId !== requestedBusinessId) {
		return res.status(403).json({ error: "Access denied to this business" });
	}

	next();
}
