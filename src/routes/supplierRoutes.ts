import {Router} from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplier,
} from "../controllers/supplierController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createSupplierSchema } from "../validators/supplierValidators.js";

const router = Router();

router.get(
  "/",
  protect,
  getSuppliers
);

router.get(
  "/:id",
  protect,
  getSupplier
);

router.post(
  "/",
  protect,
  allowRoles("admin", "project_manager", "storekeeper"),
  validate(createSupplierSchema),
  createSupplier
);

export default router;