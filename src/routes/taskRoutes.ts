import { Router } from "express";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
} from "../controllers/taskController.js";

import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  createTaskSchema,
  updateTaskSchema,
} from "../validators/taskValidators.js";

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
export default router;