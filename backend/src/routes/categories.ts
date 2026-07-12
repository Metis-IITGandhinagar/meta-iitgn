import { Router } from "express";
import { getCategories, createCategory, updateCategory } from "../controllers/category.controller.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.get("/", getCategories);
router.post("/", protect("admin", "moderator"), createCategory);
router.patch("/:id", protect("admin", "moderator"), updateCategory);

export default router;
