import { Router } from "express";
import { getFeaturedPages, setFeaturedPage, removeFeaturedPage, updateFeaturedPage } from "../controllers/featured.controller.js";
import { checkAuth, protect } from "../middlewares/auth.js";

const router = Router();

router.get("/", getFeaturedPages);
router.post("/", checkAuth, protect("admin", "moderator"), setFeaturedPage);
router.put("/:featured_id", checkAuth, protect("admin", "moderator"), updateFeaturedPage);
router.delete("/:featured_id", checkAuth, protect("admin", "moderator"), removeFeaturedPage);

export default router;
