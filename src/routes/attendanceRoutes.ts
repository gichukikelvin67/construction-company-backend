import { Router } from "express";

import {
  createAttendance,
  getProjectAttendance,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  createAttendanceSchema,
} from "../validators/attendanceValidators.js";

const router = Router();


router.get(
    "/project/:projectId",
    protect,
    getProjectAttendance
);

router.post(
  "/",
  protect,
  allowRoles(
    "admin",
    "project_manager",
    "site_supervisor"
  ),
  validate(createAttendanceSchema),
  createAttendance
);

export default router;