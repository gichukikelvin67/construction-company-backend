import {Router}from "express";

import{
    createStockMovement,
    getMaterialStock,
    getMaterialMovements,
}from "../controllers/stockMovementController.js";

import{protect}from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import{validate}from "../middleware/validate.js";

import { createStockMovementSchema } from "../validators/stockMovementValidators.js";

const router=Router();

router.get(
    "/material/:materialId/stock",
    protect,
    getMaterialMovements
);

router.get(
    "/material/:materialId/stock",
    protect,
    getMaterialStock
);

router.post(
    "/",
    protect,
    allowRoles("admin", "project_manager", "storekeeper"),
    validate(createStockMovementSchema),
    createStockMovement
);

export default router;