import { Request, Response } from "express";

import Project from "../models/Project.js";
import Worker from "../models/Worker.js";
import Material from "../models/Material.js";
import Expense from "../models/Expense.js";

export const getDashboardSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const companyId = req.user?.company;

    if (!companyId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const [
      projectCount,
      workerCount,
      materialCount,
      expenseResult,
      recentProjects,
    ] = await Promise.all([
      Project.countDocuments({
        company: companyId,
      }),

      Worker.countDocuments({
        company: companyId,
      }),

      Material.countDocuments({
        company: companyId,
        isActive: true,
      }),

      Expense.aggregate([
        {
          $match: {
            company: companyId,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),
      Project.find({
        company:companyId,
      })
      .sort({createdAt: -1})
      .limit(5)
      .lean(),
    ]);

    const totalExpenses = expenseResult[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      data: {
        projects: projectCount,
        workers: workerCount,
        materials: materialCount,
        expenses: totalExpenses,
        recentProjects,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard summary",
    });
  }
};