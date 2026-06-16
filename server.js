import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import showRoutes from "./routes/showRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/movie", movieRoutes);
app.use("/api/show", showRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/webhook", webhookRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({ success: true, message: "QuickShow API is running 🚀" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
