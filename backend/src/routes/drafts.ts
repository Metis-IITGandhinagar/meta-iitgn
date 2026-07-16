import { Router } from "express";
import { listPendingDrafts, reviewDraft, submitDraft } from "../controllers/draft.controller.js";
import { checkAuth, protect } from "../middlewares/auth.js";

const router=Router();

// Submitting a draft requires authentication; the author is taken from the token.
router.post("/", checkAuth, submitDraft);
// Listing pending drafts stays readable (home cards / profile activity render
// pending page content, which is already surfaced publicly via search + getPage).
router.get("/pending", listPendingDrafts);
// Approving/rejecting a draft publishes straight to live_pages — restrict to staff.
router.post("/:pending_id/review", checkAuth, protect("admin", "moderator"), reviewDraft);




export default router;