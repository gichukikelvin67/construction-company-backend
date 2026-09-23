import { Router } from "express";

import{
    createDailyReport,
}from "../controllers/dailyReportController.js";

import { protect} from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createDailyReportSchema } from "../validators/dailyReportValidators.js";

const router=Router();
router.post(
    "/",
    protect,
    validate(createDailyReportSchema),
    createDailyReport
);
export default router;