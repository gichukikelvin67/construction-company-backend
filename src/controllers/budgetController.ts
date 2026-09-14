import { Response } from "express";
import mongoose from "mongoose";

import Budget from "../models/Budget.js";
import Project from "../models/Project.js";
import Expense from "../models/Expense.js";
import Attendance from "../models/Attendance.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";


// CREATE PROJECT BUDGET
export const createBudget = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { projectId, categories } = req.body;

    // Check that the project ID is valid
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
      return;
    }

    // Make sure the project belongs to this company
    const project = await Project.findOne({
      _id: projectId,
      company: req.user.company,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    // Prevent creating two budgets for the same project
    const existingBudget = await Budget.findOne({
      project: projectId,
      company: req.user.company,
    });

    if (existingBudget) {
      res.status(409).json({
        success: false,
        message: "A budget already exists for this project",
      });
      return;
    }

    // Calculate the total planned budget
    const totalBudget = categories.reduce(
      (total: number, category: { amount: number }) =>
        total + category.amount,
      0
    );

    const budget = await Budget.create({
      project: projectId,
      company: req.user.company,
      categories,
      totalBudget,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Project budget created successfully",
      budget,
    });
  } catch (error) {
    console.error("Create budget error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create project budget",
    });
  }
};


// GET PROJECT BUDGET
export const getProjectBudget = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const projectId = req.params.projectId as string;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
      return;
    }

    // Check company ownership
    const project = await Project.findOne({
      _id: projectId,
      company: req.user.company,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    const budget = await Budget.findOne({
      project: projectId,
      company: req.user.company,
    }).populate("createdBy", "name email");

    if (!budget) {
      res.status(404).json({
        success: false,
        message: "Budget not found for this project",
      });
      return;
    }

    res.status(200).json({
      success: true,
      project: {
        id: project._id,
        name: project.name,
      },
      budget,
    });
  } catch (error) {
    console.error("Get project budget error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve project budget",
    });
  }
};

export const getBudgetAnalysis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const projectId = req.params.projectId as string;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
      return;
    }

    // Make sure the project belongs to the logged-in company
    const project = await Project.findOne({
      _id: projectId,
      company: req.user.company,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    // Find the project's budget
    const budget = await Budget.findOne({
      project: projectId,
      company: req.user.company,
    });

    if (!budget) {
      res.status(404).json({
        success: false,
        message: "Budget not found for this project",
      });
      return;
    }

    // Find all non-voided expenses
    const expenses = await Expense.find({
      project: projectId,
      company: req.user.company,
      isVoided: false,
    });

    // Calculate actual spending by category
    const actualSpending: Record<string, number> = {};

    for (const expense of expenses) {
      actualSpending[expense.category] =
        (actualSpending[expense.category] || 0) + expense.amount;
    }

    // Find attendance records for labour costs
    const attendance = await Attendance.find({
      project: projectId,
      company: req.user.company,
    });

    let labourCost = 0;

    for (const record of attendance) {
      if (record.status === "present") {
        labourCost += record.dailyRate;
      }

      if (record.status === "half_day") {
        labourCost += record.dailyRate * 0.5;
      }
    }

    actualSpending.labour =
      (actualSpending.labour || 0) + labourCost;

    // Compare planned budget with actual spending
    const analysis = budget.categories.map((category) => {
      const planned = category.amount;
      const actual = actualSpending[category.category] || 0;
      const remaining = planned - actual;

      const utilization =
        planned > 0
          ? Number(((actual / planned) * 100).toFixed(2))
          : 0;

      return {
        category: category.category,
        description: category.description || null,
        planned,
        actual,
        remaining,
        utilization,
        overBudget: actual > planned,
      };
    });

    const totalPlanned = budget.totalBudget;

    const totalActual = analysis.reduce(
      (total, item) => total + item.actual,
      0
    );

    const totalRemaining = totalPlanned - totalActual;

    const totalUtilization =
      totalPlanned > 0
        ? Number(((totalActual / totalPlanned) * 100).toFixed(2))
        : 0;

    res.status(200).json({
      success: true,

      project: {
        id: project._id,
        name: project.name,
      },

      summary: {
        totalPlanned,
        totalActual,
        totalRemaining,
        totalUtilization,
        overBudget: totalActual > totalPlanned,
      },

      categories: analysis,
    });
  } catch (error) {
    console.error("Get budget analysis error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to calculate budget analysis",
    });
  }
};