import {Router}from "express";

import{
    getProjectFinancialSummary,
}from "../controllers/projectFinancialController.js";

import { protect } from "../middleware/authMiddleware.js";

const router=Router();

router.get(
  "/project/:projectId",
  protect,
  getProjectFinancialSummary
);

export default router;