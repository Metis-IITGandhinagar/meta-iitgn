import { Router } from "express";
import {
  getPage, getRecentNewPages, getRecentUpdatedPages, searchPages, getPageStats,
  createPage, updatePage, deletePage, getPageCount, getSyncCheck, getPageForEdit,
  getPageById, getPopularPages, incrementViewCount, getFeaturedPages, setFeaturedPage,
  removeFeaturedPage, getEvents, getMessMenu, getCampusTransport
} from "../controllers/page.controller.js";
import { checkAuth, protect, checkAuthOptional } from "../middlewares/auth.js";

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
router.get("/featured", getFeaturedPages);
router.post("/featured", checkAuth, protect("admin"), setFeaturedPage);
router.delete("/featured/:featured_id", checkAuth, protect("admin"), removeFeaturedPage);

// Events
router.get("/events", getEvents);

// Special wiki pages (mess menu, transport)
router.get("/special/mess-menu", getMessMenu);
router.get("/special/campus-transport", getCampusTransport);

// Search
router.get("/search", searchPages);

// Page by ID
router.get("/id/:page_id", getPageById);

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