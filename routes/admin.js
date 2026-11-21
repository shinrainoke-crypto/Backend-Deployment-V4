import express from "express";
import { approveOrganizer, rejectOrganizer } from "../controllers/adminController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to approve organizer
router.post("/approve-organizer", approveOrganizer);
router.post("/reject-organizer", verifyAdmin, rejectOrganizer);

export default router;
