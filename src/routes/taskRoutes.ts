import { Router } from "express";

import {
  createTask,
  getTasks,
} from "../controllers/taskController.js";

import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  createTaskSchema,
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

export default router;