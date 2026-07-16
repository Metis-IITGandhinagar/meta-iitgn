import { Router } from "express";
import { getFeaturedPages, setFeaturedPage, removeFeaturedPage } from "../controllers/featured.controller.js";
import { checkAuth, protect } from "../middlewares/auth.js";

const router = Router();

router.get("/", getFeaturedPages);
router.post("/", checkAuth, protect("admin", "moderator"), setFeaturedPage);
router.delete("/:featured_id", checkAuth, protect("admin", "moderator"), removeFeaturedPage);

export default router;
