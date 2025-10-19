import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import testRoutes from "./routes/test.js";
import dashboardRoutes from "./routes/dashboard.js";
import inventoryRoutes from "./routes/inventory.js";
import authRoutes from "./routes/auth.js";

// Load environment variables

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route to make sure server is working
app.get("/", (req, res) => {
	res.json({
		message: "🚀 Restaurant Inventory API is running!",
		status: "healthy",
		timestamp: new Date().toISOString(),
	});
});

// Use routes (uncomment when you create the files)
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
	console.error("Error:", err);
	res.status(500).json({
		error: err.message,
		stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
	});
});

// 404 handler for undefined routes
app.use((req, res) => {
	res.status(404).json({
		error: "Route not found",
		path: req.path,
	});
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
	console.log(
		`🗄️  Database: ${process.env.SUPABASE_URL ? "Connected" : "Not configured"}`
	);
});
