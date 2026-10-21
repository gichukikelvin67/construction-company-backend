import {Router} from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  updateSupplierStatus,
} from "../controllers/supplierController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createSupplierSchema ,updateSupplierSchema,updateSupplierStatusSchema} from "../validators/supplierValidators.js";

const router = Router();
router.use(protect);

router.get("/", getSuppliers);

router.get("/:id", getSupplier);

router.post(
  "/",
  allowRoles("admin", "project_manager", "storekeeper"),
  validate(createSupplierSchema),
  createSupplier
);

router.patch(
  "/:id",
  allowRoles("admin", "project_manager", "storekeeper"),
  validate(updateSupplierSchema),
  updateSupplier
);

router.patch(
  "/:id/status",
  allowRoles("admin", "project_manager"),
  validate(updateSupplierStatusSchema),
  updateSupplierStatus
);

export default router;
