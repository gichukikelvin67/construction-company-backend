import {Response}from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";


export const createProject=async(
    req:AuthenticatedRequest,
    res:Response
): Promise<void> =>{
    try{
        if(!req.user){
            res.status(401).json({
                success:false,
                message:"Authentication required",
            })

            return;
        }

        const project=await Project.create({
            name:req.body.name,
             description: req.body.description,
      location: req.body.location,
      clientName: req.body.clientName,
      budget: req.body.budget,
      startDate: new Date(req.body.startDate),
      expectedEndDate: new Date(req.body.expectedEndDate),
      status: req.body.status,

      // We get the company from the authenticated user.
      // The client cannot choose another company.
       company: req.user.company,

      // Record who created the project.
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create project",
        })
    }
}
export const getProjects = async (
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

    const projects = await Project.find({
      company: req.user.company,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve projects",
    });
  }
};
export const getProjectById = async (
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

    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve project",
    });
  }
};

export const updateProject = async (
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

    const projectId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
      return;
    }

    const updateData = {
      ...req.body,
    };

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }

    if (updateData.expectedEndDate) {
      updateData.expectedEndDate = new Date(
        updateData.expectedEndDate
      );
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        company: req.user.company,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update project",
    });
  }
};