import {Response}from "express";

import mongoose from "mongoose";

import Attendance from "../models/Attendance.js";
import Project from "../models/Project.js";
import Worker from "../models/Worker.js";
import ProjectAssignment from "../models/ProjectAssignment.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const createAttendance = async (
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
      date,
      status,
      notes,
    } = req.body;

    // 1. Validate IDs
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

    // 2. Make sure the project belongs to this company
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

    // 3. Make sure the worker belongs to this company
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

    // 4. Find the worker's project assignment
    const assignment = await ProjectAssignment.findOne({
      project: projectId,
      worker: workerId,
      company: req.user.company,
      status: "active",
    });

    if (!assignment) {
      res.status(400).json({
        success: false,
        message:
          "Worker does not have an active assignment on this project",
      });
      return;
    }

    // 5. Make sure attendance date is not before assignment started
    const attendanceDate = new Date(date);
     const dateKey = attendanceDate.toISOString().slice(0, 10);
     
    if (attendanceDate < assignment.startDate) {
      res.status(400).json({
        success: false,
        message:
          "Attendance date cannot be before the worker's assignment start date",
      });
      return;
    }

    // 6. Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      project: projectId,
      worker: workerId,
      company: req.user.company,
      dateKey,
    });

    if (existingAttendance) {
      res.status(409).json({
        success: false,
        message:
          "Attendance has already been recorded for this worker on this date",
      });
      return;
    }

    // 7. Create attendance record
    const attendance = await Attendance.create({
      project: projectId,
      worker: workerId,
      company: req.user.company,
      date: attendanceDate,
      dateKey,
      status,
      dailyRate: assignment.dailyRate,
      notes,
      recordedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Attendance recorded successfully",
      attendance,
    });
  } catch (error) {
    console.error(
      "Create attendance error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to record attendance",
    });
  }
};

export const getProjectAttendance=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void>=>{

    try{

        if(!req.user){
            res.status(401).json({
                success:false,
                message:"Authentication required",
            })
            return;
        }

        const projectId=req.params.projectId as string;
        if(!mongoose.Types.ObjectId.isValid(projectId)){

            res.status(400).json({
                success:false,
                message:"Invalid project ID",
            })

            return;
        }

        const project=await Project.findOne({
            _id:projectId,
            company:req.user.company,
        })

        if(!project){
            res.status(404).json({
                success:false,
                message:"Project not found",
            })
            return;
        }

        const attendance=await Attendance.find({
            project:projectId,
            company:req.user.company,
        })

        .populate("worker","name phone jobTitle")
        .populate("recordedBy", "name email")
        .sort({
            date: -1,
            createdAt: -1,
        })

        res.status(200).json({
            success:true,
            count:attendance.length,
            attendance,
        })

    }catch(error){
        console.error(
            "Get project attendance error:",error
        )

        res.status(500).json({
            success:false,
            message:"Unable to get project attendance",
        })
    }
}