
import { Router } from "express";
import { createContactEnquiry } from "../controllers/contactEnquiryController.js";

const router = Router();

// Public endpoint for website contact form submissions.
router.post("/", createContactEnquiry);

export default router;
