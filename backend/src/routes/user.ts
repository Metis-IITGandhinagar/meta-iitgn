import { Router } from "express";
import { devBypass, getUsers, handleGoogleAuth, clearUser, handleMe } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.post("/", devBypass);
router.get("/", getUsers);

// Authentication routes
router.get("/auth/google", handleGoogleAuth);
router.post("/auth/google", handleGoogleAuth);
router.post("/auth/logout", clearUser);
router.get("/auth/me", protect(), handleMe);

export default router;