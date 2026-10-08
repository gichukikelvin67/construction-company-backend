import { Router } from "express";

import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/summary",
  protect,
  getDashboardSummary
);

export default router;