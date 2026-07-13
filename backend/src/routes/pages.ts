import { Router } from "express";
import { getPage, getRecentNewPages, getRecentUpdatedPages, searchPages, getPageStats, createPage, updatePage, deletePage, getPageCount, getSyncCheck } from "../controllers/page.controller.js";
import { checkAuth, protect, checkAuthOptional } from "../middlewares/auth.js";

const router=Router();

router.get("/sync-check", checkAuthOptional, getSyncCheck);
router.get("/stats", getPageStats);
router.get("/count", getPageCount);
router.get("/recent/new", getRecentNewPages);
router.get("/recent/updated", getRecentUpdatedPages);
router.get("/search", searchPages);
router.get("/:slug", getPage);
router.get("/page/:slug", getPage);

// Direct CRUD endpoints for articles/pages
router.post("/", checkAuth, protect("admin", "moderator"), createPage);
router.patch("/:slug", checkAuth, updatePage);
router.delete("/:slug", checkAuth, protect("admin"), deletePage);

export default router;