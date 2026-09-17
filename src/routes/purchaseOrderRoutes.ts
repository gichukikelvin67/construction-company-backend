import {Router}from "express";

import{createPurchaseOrder,submitPurchaseOrder,getPurchaseOrders,approvePurchaseOrder,rejectPurchaseOrder}from "../controllers/purchaseOrderController.js";

import{protect}from "../middleware/authMiddleware.js"
import { allowRoles } from "../middleware/roleMiddleware.js";
import{validate}from "../middleware/validate.js";


import{
    createPurchaseOrderSchema,
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
  rejectPurchaseOrder
);



export default router;