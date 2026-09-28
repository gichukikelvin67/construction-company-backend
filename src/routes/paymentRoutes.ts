import { Router } from "express";

import {
  createPayment,
  getPayments,
  getPaymentById,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  createPaymentSchema,
} from "../validators/paymentValidators.js";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles("admin", "accountant"),
  validate(createPaymentSchema),
  createPayment
);

router.get(
  "/",
  protect,
  allowRoles("admin", "project_manager", "accountant"),
  getPayments
);

router.get(
  "/:id",
  protect,
  allowRoles("admin", "project_manager", "accountant"),
  getPaymentById
);

export default router;