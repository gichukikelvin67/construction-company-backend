import { Router } from "express";

import{
    createDailyReport,
    getDailyReports,
    getDailyReportById,
    updateDailyReport,
    archiveDailyReport,
    restoreDailyReport,
}from "../controllers/dailyReportController.js";

import { protect} from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

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
);
router.patch(
  "/:id/archive",
  protect,
  allowRoles("admin", "project_manager"),
  archiveDailyReport
);
router.patch(
  "/:id/restore",
  protect,
  allowRoles("admin"),
  restoreDailyReport
);
export default router;