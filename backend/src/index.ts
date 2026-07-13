import { Router } from "express";

import PageRouter from "./routes/pages.js"
import DraftRouter from "./routes/drafts.js"
import UserRouter from "./routes/user.js"
import CategoryRouter from "./routes/categories.js"
import NewsRouter from "./routes/news.js"
import MediaRouter from "./routes/media.js"
import BookmarksRouter from "./routes/bookmarks.js"

const router = Router();

// Users routes
router.use("/users", UserRouter);
router.use("/user", UserRouter);

// Pages routes
router.use("/pages",PageRouter);

// Drafts / Workflows routes
router.use("/drafts",DraftRouter)
router.use("/categories", CategoryRouter);
router.use("/news", NewsRouter);
router.use("/media", MediaRouter);
router.use("/bookmarks", BookmarksRouter);

export default router;
