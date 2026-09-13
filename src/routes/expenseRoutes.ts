import {Router}from "express";

import{
    createExpense,
    getProjectExpenses,
    updateExpense,
}from "../controllers/expenseController.js";

import {protect}from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import{validate}from "../middleware/validate.js";

import { createExpenseSchema ,updateExpenseSchema} from "../validators/expenseValidators.js";


const router=Router();

router.get(
    "/project/:projectId",
    protect,
    getProjectExpenses
);

router.patch(
  "/:id",
  protect,
  allowRoles(
    "admin",
    "project_manager",
    "accountant"
  ),
  validate(updateExpenseSchema),
  updateExpense
);

router.post(
    "/",
    protect,
    allowRoles(
        "admin",
        "project_manager",
        "accountant"
    ),
    validate(createExpenseSchema),
    createExpense
)

export default router;