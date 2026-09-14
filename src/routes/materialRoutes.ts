import { Router } from "express";

import {
  createMaterial,
  getMaterials,
  getMaterial,
} from "../controllers/materialController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createMaterialSchema } from "../validators/materialValidators.js";

const router = Router();

router.get(
  "/",
  protect,
  getMaterials
);

router.get(
  "/:id",
  protect,
  getMaterial
);

router.post(
  "/",
  protect,
  allowRoles("admin", "project_manager", "storekeeper"),
  validate(createMaterialSchema),
  createMaterial
);

export default router;