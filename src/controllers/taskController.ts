import{Response}from "express";
import mongoose from "mongoose";

import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createAuditLog } from "../utils/auditLogger.js";

export const createTask = async (
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
      title,
      description,
      projectId,
      assignedTo,
      status,
      priority,
      progress,
      startDate,
      dueDate,
    } = req.body;

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

    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        company: req.user.company,
        isActive: true,
      });

      if (!assignedUser) {
        res.status(400).json({
          success: false,
          message: "Assigned user not found or inactive",
        });
        return;
      }
    }

    if (progress === 100 && status && status !== "completed") {
      res.status(400).json({
        success: false,
        message: "A task with 100% progress must be completed",
      });
      return;
    }

    const task = await Task.create({
      title,
      description,
      project: project._id,
      company: req.user.company,
      assignedTo,
      status: progress === 100 ? "completed" : status ?? "todo",
      priority: priority ?? "medium",
      progress: progress ?? 0,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      completedAt: progress === 100 ? new Date() : undefined,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "create",
      resource: "task",
      resourceId: task._id.toString(),
      description: `Created task ${task.title}`,
      metadata: {
        projectId: project._id.toString(),
        priority: task.priority,
        assignedTo: assignedTo ?? null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};

export const getTasks = async (
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

    const { projectId, status, priority, assignedTo } = req.query;

    const filter: Record<string, unknown> = {
      company: req.user.company,
    };

    // Filter by project
    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
        return;
      }

      filter.project = projectId;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }

    // Filter by assigned user
    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid assigned user ID",
        });
        return;
      }

      filter.assignedTo = assignedTo;
    }

    const tasks = await Task.find(filter)
      .populate("project", "name status")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve tasks",
    });
  }
};