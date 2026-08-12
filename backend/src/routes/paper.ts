import { Router } from "express";
import { checkAuth, protect } from "../middlewares/auth.js";
import {
    handlePapersGet,
    handleAdminDelete,
    handleDownloadCount,
    handlePaperGet,
    handlePaperUpload,
    handleUserPapersGet,
    handlePaperDelete,
} from "../controllers/paper.controller.js";
import { upload } from "../middlewares/multer.js";

const router = Router();

router.use((req, res) => {
    res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "PYQ Tool is disabled" } });
});

router.get("/", handlePapersGet);
router.get("/my", checkAuth, handleUserPapersGet);
router.get("/:id", handlePaperGet);

router.patch("/:id/download", handleDownloadCount);

router.post("/", checkAuth, upload.single("paper"), handlePaperUpload);

// Admin delete must be registered BEFORE the generic /:id delete route,
// otherwise Express matches "admin" as the :id param and never reaches this handler.
router.delete("/admin/:id", checkAuth, protect("admin"), handleAdminDelete);
router.delete("/:id", checkAuth, handlePaperDelete);

export default router;