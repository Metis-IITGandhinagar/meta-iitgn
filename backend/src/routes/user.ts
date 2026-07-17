import { Router } from "express";
import { devBypass, getUsers, handleGoogleAuth, clearUser, handleMe, getUserStats, getUserById, getUserBookmarks } from "../controllers/user.controller.js";
import { protect, checkAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/", devBypass);
// Bulk user listing exposes every user's email — restrict to admins.
router.get("/", checkAuth, protect("admin"), getUsers);
// Single-user lookup (profile view) requires authentication.
router.get("/:user_id", checkAuth, getUserById);

// Authentication routes
router.get("/auth/google", handleGoogleAuth);
router.post("/auth/google", handleGoogleAuth);
router.post("/auth/logout", clearUser);
router.get("/auth/me", protect(), handleMe);
router.get("/:user_id/stats", protect(), getUserStats);
router.get("/:user_id/bookmarks", protect(), getUserBookmarks);

export default router;