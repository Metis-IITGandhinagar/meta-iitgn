import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables before any other imports to ensure Cloudinary config resolves correctly
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./index.js";
import cookieParser from 'cookie-parser';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;

// Resolve directory paths

// Allowlisted origins for CORS. Localhost is always permitted for local dev.
// Additional production origins are configured via FRONTEND_URL (comma-separated).
const allowedOrigins = new Set<string>([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
]);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser / same-origin requests that omit an Origin header
      // (curl, server-to-server, health checks).
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      // Reject unknown origins. Because auth uses credentialed cookies, we must
      // NOT reflect arbitrary origins alongside Access-Control-Allow-Credentials.
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/api", routes);
app.use("/", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Express Wiki API" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  },
);

import { startMediaCleanupCron } from "./utils/cleanup.js";

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  startMediaCleanupCron();
});


