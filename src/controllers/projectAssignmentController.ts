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


export const getProjectAssignments = async (
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

    const assignments = await ProjectAssignment.find({
      project: projectId,
      company: req.user.company,
    })
      .populate("worker", "name phone jobTitle")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error(
      "Get project assignments error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to get project assignments",
    });
  }
};

export const updateProjectAssignment = async (
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

    const assignmentId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
      return;
    }

    const assignment = await ProjectAssignment.findOne({
      _id: assignmentId,
      company: req.user.company,
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    const { role, dailyRate, endDate, status } = req.body;

    if (endDate) {
      const newEndDate = new Date(endDate);

      if (newEndDate < assignment.startDate) {
        res.status(400).json({
          success: false,
          message: "End date cannot be before start date",
        });
        return;
      }
    }

    if (status === "active" && assignment.status !== "active") {
      const existingActiveAssignment =
        await ProjectAssignment.findOne({
          _id: { $ne: assignment._id },
          project: assignment.project,
          worker: assignment.worker,
          company: req.user.company,
          status: "active",
        });

      if (existingActiveAssignment) {
        res.status(409).json({
          success: false,
          message:
            "Worker already has an active assignment on this project",
        });
        return;
      }
    }

    if (role !== undefined) {
      assignment.role = role;
    }

    if (dailyRate !== undefined) {
      assignment.dailyRate = dailyRate;
    }

    if (endDate !== undefined) {
      assignment.endDate = new Date(endDate);
    }

    if (status !== undefined) {
      assignment.status = status;
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Project assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error(
      "Update project assignment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to update project assignment",
    });
  }
};