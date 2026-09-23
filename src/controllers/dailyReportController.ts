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
export const getDailyReports=async(
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
            fromDate,
            toDate,
            page="1",
            limit="20",
        }=req.query;
        const pageNumber=Math.max(Number(page),1);
        const limitNumber=Math.min(Math.max(Number(limit),1),100);
        const skip=(pageNumber -1)* limitNumber;

        const filter:Record<string,unknown>={
            company:req.user.company,
        };
        //Project filter
         if (projectId) {
  const projectIdString = String(projectId).trim();

  console.log("Project ID received:", projectIdString);
  console.log("Project ID length:", projectIdString.length);
  console.log(
    "Project ID valid:",
    mongoose.Types.ObjectId.isValid(projectIdString)
  );

  if (!mongoose.Types.ObjectId.isValid(projectIdString)) {
    res.status(400).json({
      success: false,
      message: "Invalid project ID",
    });
    return;
  }

  filter.project = new mongoose.Types.ObjectId(projectIdString);
}
        //Dte filtering
        if(fromDate || toDate){
            const reportDateFilter:Record<string,Date>={};
            if(fromDate){
                const startDate=new Date(fromDate as string);

                if(Number.isNaN(startDate.getTime())){
                    res.status(400).json({
                        success:false,
                        message:"Invalid fromDate",
                    });
                    return;
                }
                reportDateFilter.$gte=startDate;
            }
            if(toDate){
                const endDate=new Date(toDate as string);
                if(Number.isNaN(endDate.getTime())){
                    res.status(400).json({
                        success:false,
                        message:"Invalid toDate",
                    })
                    return;
                }
                reportDateFilter.$lte=endDate;
            }
            filter.reportDate=reportDateFilter;
        }
        const totalReports=await DailyReport.countDocuments(filter);
        const reports=await DailyReport.find(filter)
        .populate("project","name status")
        .populate("submittedBy","name email role")
        .populate("updatedBy", "name email role")
        .sort({
            reportDate: -1,
            createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber);

        const totalPages=Math.ceil(totalReports/limitNumber);

        res.status(200).json({
            success:true,
            pagination:{
                page:pageNumber,
                limit:limitNumber,
                totalReports,
                totalPages,
                hasNextPage:pageNumber<totalPages,
                hasPreviousPage:pageNumber>1,
            },
            reports,
        });

    }catch(error){
        console.error("Get daily reports error:",error);
        res.status(500).json({
            success:false,
            message:"Failed to retrieve daily reports",
        });
    }
}

//get one daily report by id
export const getDailyReportById=async(
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
        const id=req.params.id as string;
        if(!mongoose.Types.ObjectId.isValid(id)){
            res.status(400).json({
                success:false,
                message:"Invalid daily report ID",
            })
            return;
        }
        const report=await DailyReport.findOne({
            _id:id,
            company:req.user.company,
        })
        .populate("project", "name status")
        .populate("submittedBy","name email role")
        .populate("updatedBy", "name email role")

        if(!report){
            res.status(404).json({
                success:false,
                message:"Daily report not found",
            })
            return;
        }
        res.status(200).json({
            success:true,
            report,
        });
    }catch(error){
        console.error("Get daily report error:",error);

        res.status(500).json({
            success:false,
            message:"Failed ro retrieve daily report",
        });
    }
}

//update daily report
export const updateDailyReport=async(
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
        const id=req.params.id as string;
        if(!mongoose.Types.ObjectId.isValid(id)){
            res.status(400).json({
              success:false,
              message:"Invalid daily report ID",
            })   
            return;
         }
           const report = await DailyReport.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!report) {
      res.status(404).json({
        success: false,
        message: "Daily report not found",
      });
      return;
    }

    const {
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
    } = req.body;

    // Keep the original date unless a new one was provided
    if (reportDate !== undefined) {
      const newReportDate = new Date(reportDate);

      // Check if another report already uses this date
      if (
        newReportDate.getTime() !==
        report.reportDate.getTime()
      ) {
        const existingReport = await DailyReport.findOne({
          _id: { $ne: report._id },
          company: req.user.company,
          project: report.project,
          reportDate: newReportDate,
        });

        if (existingReport) {
          res.status(409).json({
            success: false,
            message:
              "A daily report already exists for this project and date",
          });
          return;
        }

        report.reportDate = newReportDate;
      }
    }

    if (weather !== undefined) {
      report.weather = weather;
    }

    if (workersPresent !== undefined) {
      report.workersPresent = workersPresent;
    }

    if (workCompleted !== undefined) {
      report.workCompleted = workCompleted;
    }

    if (workPlanned !== undefined) {
      report.workPlanned = workPlanned;
    }

    if (materialsUsed !== undefined) {
      report.materialsUsed = materialsUsed;
    }

    if (equipmentUsed !== undefined) {
      report.equipmentUsed = equipmentUsed;
    }

    if (delays !== undefined) {
      report.delays = delays;
    }

    if (safetyIncidents !== undefined) {
      report.safetyIncidents = safetyIncidents;
    }

    if (notes !== undefined) {
      report.notes = notes;
    }

    report.updatedBy = new mongoose.Types.ObjectId(
      req.user.id
    );

    await report.save();

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "daily_report",
      resourceId: report._id.toString(),
      description: `Updated daily report ${report._id}`,
      metadata: {
        projectId: report.project.toString(),
        reportDate: report.reportDate.toISOString(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Daily report updated successfully",
      report,
    });
  } catch (error) {
    console.error("Update daily report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update daily report",
    });
  }

}
