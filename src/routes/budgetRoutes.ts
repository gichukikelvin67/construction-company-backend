import {Router}from "express";

import{
    createBudget,
    getProjectBudget,
}from "../controllers/budgetController.js";

import {protect} from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import{validate}from "../middleware/validate.js"

import { createBudgetSchema } from "../validators/budgetValidators.js";


const router=Router();

router.post(
    "/",
    protect,
    allowRoles("admin","project_manager","accountant"),
    validate(createBudgetSchema),
    createBudget
);

router.get(
    "/project/:projectId",
    protect,
    getProjectBudget
);

export default router;