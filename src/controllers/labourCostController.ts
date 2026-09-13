import{Response} from"express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Project from "../models/Project.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";


export const getProjectLabourCost=async(
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
            _id: projectId,
            company:req.user.company,
        })

        if(!project){
            res.status(404).json({
                success:false,
                message:"Project not found"
            })
            return;
        }

         const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const attendanceFilter: {
      project: mongoose.Types.ObjectId;
      company: mongoose.Types.ObjectId;
      dateKey?: {
        $gte?: string;
        $lte?: string;
      };
    } = {
      project: project._id,
      company: new mongoose.Types.ObjectId(req.user.company),
    };

    if (from || to) {
      attendanceFilter.dateKey = {};

      if (from) {
        attendanceFilter.dateKey.$gte = from;
      }

      if (to) {
        attendanceFilter.dateKey.$lte = to;
      }
    }

    const attendance = await Attendance.find(attendanceFilter)
      .populate("worker", "name jobTitle")
      .sort({ dateKey: 1 });

    let totalLabourCost = 0;
    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    const records = attendance.map((record) => {
      let labourCost = 0;

      switch (record.status) {
        case "present":
          labourCost = record.dailyRate;
          presentDays++;
          break;

        case "half_day":
          labourCost = record.dailyRate * 0.5;
          halfDays++;
          break;

        case "absent":
          labourCost = 0;
          absentDays++;
          break;

        case "leave":
          labourCost = 0;
          leaveDays++;
          break;
      }

      totalLabourCost += labourCost;

      return {
        attendanceId: record._id,
        worker: record.worker,
        date: record.date,
        dateKey: record.dateKey,
        status: record.status,
        dailyRate: record.dailyRate,
        labourCost,
      };
    });

    res.status(200).json({
      success: true,

      project: {
        id: project._id,
        name: project.name,
      },

      filters: {
        from: from ?? null,
        to: to ?? null,
      },

      summary: {
        totalLabourCost,
        attendanceCount: records.length,
        presentDays,
        halfDays,
        absentDays,
        leaveDays,
      },

      records,
    });
  } catch (error) {
    console.error("Get project labour cost error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to calculate project labour cost",
    });
  }
};