import { Router } from "express";
import { getCategories, createCategory, updateCategory, getCategoryArticles } from "../controllers/category.controller.js";
import { protect, checkAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", getCategories);
router.get("/:slug/articles", getCategoryArticles);
router.post("/", checkAuth, protect("admin", "moderator"), createCategory);
router.patch("/:id", checkAuth, protect("admin", "moderator"), updateCategory);

export default router;
