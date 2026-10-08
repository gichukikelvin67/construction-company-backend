import { Response } from "express";
import mongoose from "mongoose";

import WorkerAssignment from "../models/WorkerAssignment.js";
import Worker from "../models/Worker.js";
import Project from "../models/Project.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const createWorkerAssignment = async (
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
      roleOnProject,
      startDate,
      endDate,
      agreedDailyRate,
    } = req.body;

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

    // Make sure the worker belongs to this company
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

    // Do not allow inactive or suspended workers
    if (worker.status !== "active") {
      res.status(400).json({
        success: false,
        message: "Only active workers can be assigned to projects",
      });
      return;
    }

    // Check for an existing assignment
    const existingAssignment = await WorkerAssignment.findOne({
      company: req.user.company,
      project: projectId,
      worker: workerId,
    });

    if (existingAssignment) {
      res.status(409).json({
        success: false,
        message: "This worker is already assigned to this project",
      });
      return;
    }

    // Make sure end date is not before start date
    if (
      endDate &&
      new Date(endDate).getTime() < new Date(startDate).getTime()
    ) {
      res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
      return;
    }

    const assignment = await WorkerAssignment.create({
      company: req.user.company,
      project: projectId,
      worker: workerId,
      roleOnProject,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      agreedDailyRate,
      assignedBy: req.user.id,
    });

    const populatedAssignment =
      await WorkerAssignment.findById(assignment._id)
        .populate("worker", "name phone jobTitle dailyRate status")
        .populate("project", "name location status");

    res.status(201).json({
      success: true,
      message: "Worker assigned to project successfully",
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error("Create worker assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to assign worker to project",
    });
  }
};

export const getProjectWorkers = async (
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

    const assignments = await WorkerAssignment.find({
      company: req.user.company,
      project: projectId,
    })
      .populate(
        "worker",
        "name phone email jobTitle dailyRate status"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get project workers error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve project workers",
    });
  }
};

export const getWorkerProjects = async (
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

    const workerId = req.params.workerId as string;

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      res.status(400).json({
        success: false,
        message: "Invalid worker ID",
      });
      return;
    }

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

    const assignments = await WorkerAssignment.find({
      company: req.user.company,
      worker: workerId,
    })
      .populate(
        "project",
        "name location clientName status startDate expectedEndDate"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get worker projects error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve worker projects",
    });
  }
};

export const updateWorkerAssignment = async (
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

    const assignment = await WorkerAssignment.findOne({
      _id: assignmentId,
      company: req.user.company,
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Worker assignment not found",
      });
      return;
    }

    const {
      roleOnProject,
      startDate,
      endDate,
      agreedDailyRate,
      status,
    } = req.body;

    const finalStartDate = startDate
      ? new Date(startDate)
      : assignment.startDate;

    const finalEndDate = endDate
      ? new Date(endDate)
      : assignment.endDate;

    if (
      finalEndDate &&
      finalEndDate.getTime() < finalStartDate.getTime()
    ) {
      res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
      return;
    }

    if (roleOnProject !== undefined) {
      assignment.roleOnProject = roleOnProject;
    }

    if (startDate !== undefined) {
      assignment.startDate = new Date(startDate);
    }

    if (endDate !== undefined) {
      assignment.endDate = new Date(endDate);
    }

    if (agreedDailyRate !== undefined) {
      assignment.agreedDailyRate = agreedDailyRate;
    }

    if (status !== undefined) {
      assignment.status = status;
    }

    await assignment.save();

    const updatedAssignment =
      await WorkerAssignment.findById(assignment._id)
        .populate("worker", "name phone jobTitle dailyRate status")
        .populate("project", "name location status");

    res.status(200).json({
      success: true,
      message: "Worker assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Update worker assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update worker assignment",
    });
  }
};