import { Router } from "express";

import { getAuditLogs } from "../controllers/auditLogController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getAuditLogs
);

export default router;