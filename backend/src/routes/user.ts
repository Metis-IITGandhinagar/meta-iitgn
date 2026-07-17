import { Router } from "express";
import { devBypass, getUsers, handleGoogleAuth, clearUser, handleMe, getUserStats, getUserById, getUserBookmarks, getUsersCount, updateUserRole } from "../controllers/user.controller.js";
import { protect, checkAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/", devBypass);
// Bulk user listing exposes every user's email — restrict to admins.
router.get("/", checkAuth, protect("admin"), getUsers);
router.get("/count", checkAuth, protect("admin"), getUsersCount);
// Single-user lookup (profile view) requires authentication.
router.get("/:user_id", checkAuth, getUserById);
router.put("/:user_id/role", checkAuth, protect("admin"), updateUserRole);

// Authentication routes
router.get("/auth/google", handleGoogleAuth);
router.post("/auth/google", handleGoogleAuth);
router.post("/auth/logout", clearUser);
router.get("/auth/me", protect(), handleMe);
router.get("/:user_id/stats", protect(), getUserStats);
router.get("/:user_id/bookmarks", protect(), getUserBookmarks);

export default router;