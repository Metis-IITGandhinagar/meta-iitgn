import { Router } from "express";
import {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  listBlogDrafts,
  getBlogDraftById,
  deleteBlogDraft,
  reviewBlogDraft,
  getBlogRevisions,
  revertBlogToRevision,
} from "../controllers/blog.controller.js";
import { checkAuth, protect } from "../middlewares/auth.js";

const router = Router();

// Public routes
router.get("/", getBlogs);
router.get("/:slug/revisions", getBlogRevisions);
router.get("/:slug", getBlogBySlug);

// Authenticated routes
router.post("/", checkAuth, createBlog);
router.put("/:slug", checkAuth, updateBlog);
router.delete("/:slug", checkAuth, deleteBlog);

// Drafts and reviews routes
router.get("/drafts/pending", checkAuth, listBlogDrafts);
router.get("/drafts/:pending_id", checkAuth, getBlogDraftById);
router.delete("/drafts/:pending_id", checkAuth, deleteBlogDraft);
router.post("/drafts/:pending_id/review", checkAuth, protect("admin", "moderator"), reviewBlogDraft);
router.post("/:slug/revisions/:revision_id/revert", checkAuth, protect("admin", "moderator"), revertBlogToRevision);

export default router;
