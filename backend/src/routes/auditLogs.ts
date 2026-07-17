import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLog.controller.js";
import { protect, checkAuth } from "../middlewares/auth.js";

const router = Router();

// Only admin role can query audit logs
router.get("/", checkAuth, protect("admin"), getAuditLogs);

export default router;
