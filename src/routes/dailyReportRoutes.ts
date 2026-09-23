import { Router } from "express";

import{
    createDailyReport,
    getDailyReports,
    getDailyReportById,
    updateDailyReport,
}from "../controllers/dailyReportController.js";

import { protect} from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createDailyReportSchema ,updateDailyReportSchema} from "../validators/dailyReportValidators.js";

const router=Router();
router.post(
    "/",
    protect,
    validate(createDailyReportSchema),
    createDailyReport
);
router.get(
  "/",
  protect,
  getDailyReports
);
router.get(
  "/:id",
  protect,
  getDailyReportById
);

router.patch(
    "/:id",
  protect,
  validate(updateDailyReportSchema),
  updateDailyReport
)
export default router;