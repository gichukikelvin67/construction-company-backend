import{Response} from "express";
import mongoose from "mongoose";

import Project from "../models/Project.js";
import Attendance from "../models/Attendance.js";
import Expense from "../models/Expense.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getProjectById } from "./projectController.js";


export const getProjectFinancialSummary=async(

    req:AuthenticatedRequest,
    res:Response
):Promise<void> =>{
    try{
        if(!req.user){
            res.status(401).json({
                success:false,
                message:"Authentication required"
            })
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

    const expenses = await Expense.find({
      project: projectId,
      company: req.user.company,
      isVoided: false,
    });

    const expenseCost = expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    const totalSpent = labourCost + expenseCost;

    const remainingBudget = Math.max(
      project.budget - totalSpent,
      0
    );

    const budgetUtilization =
      project.budget > 0
        ? (totalSpent / project.budget) * 100
        : 0;

    res.status(200).json({
      success: true,

      project: {
        id: project._id,
        name: project.name,
        budget: project.budget,
        status: project.status,
      },

      financialSummary: {
        labourCost,
        expenseCost,
        totalSpent,
        remainingBudget,
        budgetUtilization: Number(
          budgetUtilization.toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get project financial summary error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to calculate project financial summary",
    });
  }
};