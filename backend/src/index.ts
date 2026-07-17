import { Router } from "express";

import PageRouter from "./routes/pages.js"
import DraftRouter from "./routes/drafts.js"
import UserRouter from "./routes/user.js"
import CategoryRouter from "./routes/categories.js"
import NewsRouter from "./routes/news.js"
import MediaRouter from "./routes/media.js"
import BookmarksRouter from "./routes/bookmarks.js"
import BlogRouter from "./routes/blogs.js"
import CollegeInfoRouter from "./routes/collegeinfo.js"
import AuditLogRouter from "./routes/auditLogs.js";

const router = Router();

// Users routes
router.use("/users", UserRouter);
router.use("/user", UserRouter);
router.use("/audit-logs", AuditLogRouter);

// Pages routes
router.use("/pages",PageRouter);

// College Info routes (events, mess menu, campus transport)
router.use("/collegeinfo", CollegeInfoRouter);

// Drafts / Workflows routes
router.use("/drafts",DraftRouter)
router.use("/categories", CategoryRouter);
router.use("/news", NewsRouter);
router.use("/media", MediaRouter);
router.use("/bookmarks", BookmarksRouter);
router.use("/blogs", BlogRouter);

export default router;
