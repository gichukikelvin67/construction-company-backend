import { Router } from "express";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskProgress,
  deleteTask,
} from "../controllers/taskController.js";

import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskProgressSchema,

} from "../validators/taskValidators.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();

// Create a task
router.post(
  "/",
  protect,
  validate(createTaskSchema),
  createTask
);

// Get tasks
router.get(
  "/",
  protect,
  getTasks
);

router.get(
  "/:id",
  protect,
  getTaskById
);
router.patch(
  "/:id",
  protect,
  validate(updateTaskSchema),
  updateTask
);
router.patch(
  "/:id/progress",
  protect,
  validate(updateTaskProgressSchema),
  updateTaskProgress
);

router.delete(
  "/:id",
  protect,
  allowRoles("admin", "project_manager"),
  deleteTask
);
export default router;