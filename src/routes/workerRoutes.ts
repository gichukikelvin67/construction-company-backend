import { Router } from "express";

import {
  createWorker,
  getWorkers,
  getWorkerById,
  updateWorker,
} from "../controllers/workerController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createWorkerSchema,updateWorkerSchema } from "../validators/workerValidators.js";

const router = Router();

router.get(
  "/",
  protect,
  getWorkers
);

router.get(
  "/:id",
  protect,
  getWorkerById
);

router.patch(
  "/:id",
  protect,
  allowRoles("admin", "project_manager"),
  validate(updateWorkerSchema),
  updateWorker
);

router.post(
  "/",
  protect,
  allowRoles("admin", "project_manager"),
  validate(createWorkerSchema),
  createWorker
);

export default router;