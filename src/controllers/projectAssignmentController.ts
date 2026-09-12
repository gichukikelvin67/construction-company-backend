import { Response } from "express";
import mongoose from "mongoose";

import ProjectAssignment from "../models/ProjectAssignment.js";
import Project from "../models/Project.js";
import Worker from "../models/Worker.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const createProjectAssignment = async (
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

    const {
      projectId,
      workerId,
      role,
      dailyRate,
      startDate,
      endDate,
    } = req.body;

    // Make sure the IDs are valid MongoDB IDs
    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(workerId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid project or worker ID",
      });
      return;
    }

    // Find the project AND make sure it belongs to this company
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

    // Find the worker AND make sure it belongs to this company
    const worker = await Worker.findOne({
      _id: workerId,
      company: req.user.company,
    });

    if (!worker) {
      res.status(404).json({
        success: false,
        message: "Worker not found",
      });
      return;
    }

    // Don't assign inactive or suspended workers
    if (worker.status !== "active") {
      res.status(400).json({
        success: false,
        message: "Only active workers can be assigned",
      });
      return;
    }

    // Check whether this worker is already actively assigned
    const existingAssignment =
      await ProjectAssignment.findOne({
        project: projectId,
        worker: workerId,
        company: req.user.company,
        status: "active",
      });

    if (existingAssignment) {
      res.status(409).json({
        success: false,
        message: "Worker is already assigned to this project",
      });
      return;
    }

    const assignment =
      await ProjectAssignment.create({
        project: projectId,
        worker: workerId,
        company: req.user.company,
        role,
        dailyRate,
        startDate: new Date(startDate),
        endDate: endDate
          ? new Date(endDate)
          : undefined,
        assignedBy: req.user.id,
      });

    res.status(201).json({
      success: true,
      message: "Worker assigned to project successfully",
      assignment,
    });
  } catch (error) {
    console.error(
      "Create project assignment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to assign worker to project",
    });
  }
};