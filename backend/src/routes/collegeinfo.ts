import { Router } from "express";
import { 
  getEvents, 
  createEvent,
  updateEvent,
  deleteEvent,
  getMessMenu, 
  updateMessMenu,
  getCampusTransport,
  updateCampusTransport
} from "../controllers/collegeinfo.controller.js";
import { checkAuth, protect } from "../middlewares/auth.js";

const router = Router();

router.get("/events", getEvents);
router.post("/events", checkAuth, protect("admin", "moderator"), createEvent);
router.put("/events/:event_id", checkAuth, protect("admin", "moderator"), updateEvent);
router.delete("/events/:event_id", checkAuth, protect("admin", "moderator"), deleteEvent);

router.get("/mess-menu", getMessMenu);
router.put("/mess-menu", checkAuth, protect("admin", "moderator"), updateMessMenu);

router.get("/campus-transport", getCampusTransport);
router.put("/campus-transport", checkAuth, protect("admin", "moderator"), updateCampusTransport);

export default router;
