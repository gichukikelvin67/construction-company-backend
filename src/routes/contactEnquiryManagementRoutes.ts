
import { Router } from "express";
import {
  getContactEnquiries,
  getContactEnquiryById,
  updateContactEnquiryStatus,
} from "../controllers/contactEnquiryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();

// All management routes require an authenticated, authorized staff member.
router.use(protect);
router.use(allowRoles("admin", "project_manager"));

router.get("/", getContactEnquiries);
router.get("/:id", getContactEnquiryById);
router.patch("/:id/status", updateContactEnquiryStatus);

export default router;
