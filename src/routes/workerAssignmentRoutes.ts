import { Router } from "express";

import {
  createWorkerAssignment,
  getProjectWorkers,
  getWorkerProjects,
  updateWorkerAssignment,
} from "../controllers/workerAssignmentController.js";

import { protect } from "../middleware/authMiddleware.js";

import { allowRoles } from "../middleware/roleMiddleware.js";

import { validate } from "../middleware/validate.js";

import {
  createWorkerAssignmentSchema,
  updateWorkerAssignmentSchema,
} from "../validators/workerAssignmentValidators.js";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles("admin", "project_manager"),
  validate(createWorkerAssignmentSchema),
  createWorkerAssignment
);

router.get(
  "/project/:projectId",
  protect,
  getProjectWorkers
);

router.get(
  "/worker/:workerId",
  protect,
  getWorkerProjects
);

router.patch(
  "/:id",
  protect,
  allowRoles("admin", "project_manager"),
  validate(updateWorkerAssignmentSchema),
  updateWorkerAssignment
);

export default router;