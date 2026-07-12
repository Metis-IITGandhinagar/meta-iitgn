import { Router } from "express";

import PageRouter from "./routes/pages.js"
import DraftRouter from "./routes/drafts.js"
import UserRouter from "./routes/user.js"
import CategoryRouter from "./routes/categories.js"

const router = Router();

// Users routes
router.use("/users", UserRouter);
router.use("/user", UserRouter);

// Pages routes
router.use("/pages",PageRouter);

// Drafts / Workflows routes
router.use("/drafts",DraftRouter)
router.use("/categories", CategoryRouter);

export default router;
