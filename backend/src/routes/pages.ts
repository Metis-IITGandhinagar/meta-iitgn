import { Router } from "express";
import {
  getPage, getRecentNewPages, getRecentUpdatedPages, searchPages, getPageStats,
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
router.post("/", checkAuth, (req, res, next) => {
  const { title, slug } = req.body;
  const isSelfProfile = (title === `profile-${req.user.user_id}`) || 
                        (slug === `profile-${req.user.user_id}`) ||
                        (title && title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-') === `profile-${req.user.user_id}`);
  if (isSelfProfile) {
    return next();
  }
  return protect("admin", "moderator")(req, res, next);
}, createPage);
router.patch("/:slug", checkAuth, updatePage);
router.delete("/:slug", checkAuth, protect("admin"), deletePage);

export default router;