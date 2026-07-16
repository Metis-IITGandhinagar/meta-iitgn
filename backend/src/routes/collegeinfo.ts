import { Router } from "express";
import { getEvents, getMessMenu, getCampusTransport } from "../controllers/collegeinfo.controller.js";

const router = Router();

router.get("/events", getEvents);
router.get("/mess-menu", getMessMenu);
router.get("/campus-transport", getCampusTransport);

export default router;
