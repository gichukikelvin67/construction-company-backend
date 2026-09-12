import { Response } from "express";
import mongoose from "mongoose";

import Worker from "../models/Worker.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const createWorker = async (
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

    const worker = await Worker.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      nationalId: req.body.nationalId,
      jobTitle: req.body.jobTitle,
      dailyRate: req.body.dailyRate,
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactPhone: req.body.emergencyContactPhone,

      // Never trust the frontend with company ownership
      company: req.user.company,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Worker created successfully",
      worker,
    });
  } catch (error) {
    console.error("Create worker error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create worker",
    });
  }
};

export const getWorkers = async (
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

    const workers = await Worker.find({
      company: req.user.company,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    console.error("Get workers error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve workers",
    });
  }
};

export const getWorkerById = async (
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

    const workerId = req.params.id as string;

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

    res.status(200).json({
      success: true,
      worker,
    });
  } catch (error) {
    console.error("Get worker error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve worker",
    });
  }
};

export const updateWorker = async (
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

    const workerId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      res.status(400).json({
        success: false,
        message: "Invalid worker ID",
      });
      return;
    }

    const worker = await Worker.findOneAndUpdate(
      {
        _id: workerId,
        company: req.user.company,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!worker) {
      res.status(404).json({
        success: false,
        message: "Worker not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Worker updated successfully",
      worker,
    });
  } catch (error) {
    console.error("Update worker error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update worker",
    });
  }
};