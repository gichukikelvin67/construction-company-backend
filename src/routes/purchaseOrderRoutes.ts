import {Router}from "express";

import{createPurchaseOrder,
  submitPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
}from "../controllers/purchaseOrderController.js";

import{protect}from "../middleware/authMiddleware.js"
import { allowRoles } from "../middleware/roleMiddleware.js";
import{validate}from "../middleware/validate.js";


import{
    createPurchaseOrderSchema,
    receivePurchaseOrderSchema,
    rejectPurchaseOrderSchema,
    cancelPurchaseOrderSchema,
}from"../validators/purchaseOrderValidators.js"

const router=Router();

//create purchase order

router.post(
  "/",
  protect,
  allowRoles(
    "admin",
    "project_manager",
    "storekeeper"
  ),
  validate(createPurchaseOrderSchema),
  createPurchaseOrder
);

router.patch(
  "/:id/submit",
  protect,
  allowRoles(
    "admin",
    "project_manager",
    "storekeeper"
  ),
  submitPurchaseOrder
);

router.get(
  "/",
  protect,
  getPurchaseOrders
);

router.get(
  "/:id",
  protect,
  getPurchaseOrderById
);

router.patch(
  "/:id/approve",
  protect,
  allowRoles("admin", "accountant"),
  approvePurchaseOrder
);

router.patch(
  "/:id/reject",
  protect,
  allowRoles("admin", "accountant"),
  validate(rejectPurchaseOrderSchema),
  rejectPurchaseOrder
);

router.patch(
  "/:id/cancel",
  protect,
  allowRoles("admin", "project_manager"),
  validate(cancelPurchaseOrderSchema),
  cancelPurchaseOrder
);

router.patch(
  "/:id/receive",
  protect,
  allowRoles("admin", "storekeeper"),
  validate(receivePurchaseOrderSchema),
  receivePurchaseOrder
);



export default router;