import { Response } from "express";
import mongoose from "mongoose";

import Budget from "../models/Budget.js";
import Project from "../models/Project.js";

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