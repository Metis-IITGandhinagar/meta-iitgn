import { Router } from "express";
import { getBookmarks, createBookmark, deleteBookmark } from "../controllers/bookmarks.controller.js";
import { checkAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", checkAuth, getBookmarks);
router.post("/", checkAuth, createBookmark);
router.delete("/:id", checkAuth, deleteBookmark);

export default router;
