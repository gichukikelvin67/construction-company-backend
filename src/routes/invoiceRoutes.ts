import { Router } from "express";

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  archiveInvoice,
} from "../controllers/invoiceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  createInvoiceSchema,
  updateInvoiceSchema,
} from "../validators/invoiceValidators.js";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles("admin", "project_manager", "accountant"),
  validate(createInvoiceSchema),
  createInvoice
);

router.get(
  "/",
  protect,
  allowRoles("admin", "project_manager", "accountant"),
  getInvoices
);

router.get(
  "/:id",
  protect,
  allowRoles("admin", "project_manager", "accountant"),
  getInvoiceById
);

router.patch(
  "/:id",
  protect,
  allowRoles("admin", "project_manager", "accountant"),
  validate(updateInvoiceSchema),
  updateInvoice
);

router.patch(
  "/:id/archive",
  protect,
  allowRoles("admin", "project_manager"),
  archiveInvoice
);

export default router;