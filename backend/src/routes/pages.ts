import { Router } from "express";
import {
  getPage, getRecentNewPages, getRecentUpdatedPages, searchPages, getPagesList, getPageStats,
  createPage, updatePage, deletePage, getPageCount, getSyncCheck, getPageForEdit,
  getPageById, getPopularPages, incrementViewCount, getPageRevisions, revertPageToRevision
} from "../controllers/page.controller.js";
import { checkAuth, protect, checkAuthOptional } from "../middlewares/auth.js";
import featuredRouter from "./featured.js";

const router = Router();

// Sync & stats
router.get("/sync-check", checkAuthOptional, getSyncCheck);
router.get("/stats", getPageStats);
router.get("/count", getPageCount);

// Recent pages
router.get("/recent/new", getRecentNewPages);
router.get("/recent/updated", getRecentUpdatedPages);

// Popular & featured
router.get("/popular", getPopularPages);
router.use("/featured", featuredRouter);

// Search
router.get("/search", searchPages);

// Full page list (for editor autocomplete)
router.get("/list", checkAuthOptional, getPagesList);

// Page by ID
router.get("/id/:page_id", getPageById);

// Revisions & Revert
router.get("/:slug/revisions", getPageRevisions);
router.post("/:slug/revisions/:revision_id/revert", checkAuth, protect("admin", "moderator"), revertPageToRevision);

// View tracking
router.post("/:slug/view", incrementViewCount);

// Edit & CRUD
router.get("/:slug/edit", checkAuth, getPageForEdit);
router.get("/:slug", getPage);
router.get("/page/:slug", getPage);
router.post("/", checkAuth, protect("admin", "moderator"), createPage);
router.patch("/:slug", checkAuth, updatePage);
router.delete("/:slug", checkAuth, protect("admin"), deletePage);

export default router;