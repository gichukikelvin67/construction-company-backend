import {Response}from "express";
import mongoose from "mongoose";
import DailyReport from "../models/DailyReport.js";
import Project from "../models/Project.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createAuditLog } from "../utils/auditLogger.js";
export const createDailyReport=async(
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
        const{
            projectId,
            reportDate,
            weather,
            workersPresent,
            workCompleted,
            workPlanned,
            materialsUsed,
            equipmentUsed,
            delays,
            safetyIncidents,
            notes,
        }=req.body;
        //Make sure the project exists
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
        const parsedReportDate=new Date(reportDate);
        //Prevennt duplicate daily reports
        const existingReport=await DailyReport.findOne({
            company:req.user.company,
            project:project._id,
            reportDate:parsedReportDate,
        })
        if(existingReport){
            res.status(409).json({
                success:false,
                message:"A daily report already exists for this project and date",
            })
            return;
        }
        const report=await DailyReport.create({
            company:req.user.company,
              project: project._id,
      reportDate: parsedReportDate,

      weather,
      workersPresent,
      workCompleted,
      workPlanned,
      materialsUsed,
      equipmentUsed,
      delays,
      safetyIncidents,
      notes,

      submittedBy: req.user.id,
      updatedBy: req.user.id,
        })
         await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "create",
      resource: "daily_report",
      resourceId: report._id.toString(),
      description: `Created daily report for project ${project.name}`,
      metadata: {
        projectId: project._id.toString(),
        reportDate: parsedReportDate.toISOString(),
        workersPresent,
      },
    });

    res.status(200).json({
        success:true,
        message:"Daily report created successfully",
        report,
    })
    }catch(error){
        console.error("Create daily report error:",error);
    //MongoDB duplicate key protection
    if(
        error instanceof mongoose.Error &&
        "code" in error &&
        (error as mongoose.mongo.MongoServerError).code ===11000
    ){
        res.status(409).json({
            sucess:false,
            message:"A daily report exist for this project and date",
        })
        return;

    }
    res.status(500).json({
        success:false,
        message:"Failed to create daily report",
    })
    }
}