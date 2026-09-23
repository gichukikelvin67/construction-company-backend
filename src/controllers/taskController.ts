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

    const { projectId, status, priority, assignedTo,search,page="1",limit="20"} = req.query;
//Convert pagination values to numbers
const pageNumber=Math.max(Number(page),1);
const limitNumber=Math.min(Math.max(Number(limit),1),100);
const skip=(pageNumber-1)* limitNumber;

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
    //Search task title and description
    if(search){
        const searchText=String(search).trim();
        if(searchText.length >0){
            filter.$or=[
                {
                title:{
                    $regex:searchText,
                    $options:"i",
                },
            },
            
            {
                description:{
                    $regex:searchText,
                    $options:"i",
                }
            }
        ];
        }
    }
    //Get total number of matching tasks
    const totalTasks=await Task.countDocuments(filter);
    //Get tasks for current page

    const tasks = await Task.find(filter)
      .populate("project", "name status")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

      const totalPages=Math.ceil(totalTasks/limitNumber);

    res.status(200).json({
      success: true,
      pagination:{
        page:pageNumber,
        limit:limitNumber,
        totalTasks,
        totalPages,
        hasNextPage:pageNumber<totalPages,
        hasPreviousPage:pageNumber>1,
      },
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

export const getTaskById = async (
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

    const  id  = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
      return;
    }

    const task = await Task.findOne({
      _id: id,
      company: req.user.company,
    })
      .populate("project", "name status")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve task",
    });
  }
};

export const updateTask = async (
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

    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
      return;
    }

    const task = await Task.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    const {
      title,
      description,
      assignedTo,
      status,
      priority,
      progress,
      startDate,
      dueDate,
    } = req.body;

    // Make sure the assigned user belongs to the same company
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

    // Prevent invalid progress/status combinations
    if (status === "completed" && progress !== undefined && progress !== 100) {
      res.status(400).json({
        success: false,
        message: "A completed task must have 100% progress",
      });
      return;
    }

    if (progress === 100 && status && status !== "completed") {
      res.status(400).json({
        success: false,
        message: "A task with 100% progress must be completed",
      });
      return;
    }

    // Validate dates when both are supplied
    const newStartDate =
      startDate !== undefined
        ? startDate
          ? new Date(startDate)
          : null
        : task.startDate;

    const newDueDate =
      dueDate !== undefined
        ? dueDate
          ? new Date(dueDate)
          : null
        : task.dueDate;

    if (
      newStartDate &&
      newDueDate &&
      newDueDate < newStartDate
    ) {
      res.status(400).json({
        success: false,
        message: "Due date cannot be before start date",
      });
      return;
    }

    // Update only the fields that were provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;

    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo
        ? new mongoose.Types.ObjectId(assignedTo)
        : undefined;
    }

    if (priority !== undefined) task.priority = priority;

    if (startDate !== undefined) {
      task.startDate = startDate ? new Date(startDate) : undefined;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    if (status !== undefined) {
      task.status = status;
    }

    if (progress !== undefined) {
      task.progress = progress;
    }

    // Completing a task automatically sets progress to 100%
    if (task.status === "completed") {
      task.progress = 100;
      task.completedAt = task.completedAt ?? new Date();
    } else {
      task.completedAt = undefined;
    }

    task.updatedBy = new mongoose.Types.ObjectId(req.user.id);

    await task.save();

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "task",
      resourceId: task._id.toString(),
      description: `Updated task ${task.title}`,
      metadata: {
        status: task.status,
        priority: task.priority,
        progress: task.progress,
      },
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
};

export const updateTaskProgress=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void>=>{
    try{
        if(!req.user){
            res.status(401).json({
                success:false,
                message:"Authentication required"
            })
            return;
        }
        const id=req.params.id as string;
        const{progress}=req.body;
        if(!mongoose.Types.ObjectId.isValid(id)){
            res.status(400).json({
                success:false,
                message:"Invalid task ID",
            })
            return;
        }
        const task=await Task.findOne({
            _id:id,
            company:req.user.company,
        })
        if(!task){
            res.status(404).json({
                success:false,
                message:"Task not found",
            })
            return;
        }
        //Update progress
        task.progress=progress;

        //Automatically manage task status
        if(progress===100){
            task.status="completed";
            task.completedAt=new Date();
        }else if(progress>0){
            task.status="in_progress";
            task.completedAt=undefined;
        }else{
            task.status="todo";
            task.completedAt=undefined;
        }
        task.updatedBy=new mongoose.Types.ObjectId(req.user.id);
        await task.save();
        await createAuditLog({
            companyId:req.user.company,
            userId:req.user.id,
            action:"update",
            resource:"task",
            resourceId:task._id.toString(),
            description:`Updated progress for task ${task.title}to ${progress}%`,
            metadata:{
                progress,
                status:task.status,
            },
        });

        res.status(200).json({
            success:true,
            message:"Task progress updated successfully",
            task,
        })

    }catch(error){
        console.error("Update task progress error:",error);

        res.status(500).json({
            success:false,
            message:"Failed to update task progress",
        })
    }
};

export const deleteTask=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void>=>{
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
                message:"Invalid task ID",
            })
            return;
        }
        const task=await Task.findOne({
           _id:id,
           company:req.user.company, 
        })
        if(!task){
            res.status(404).json({
                success:false,
                message:"Task not found",
            })
            return;
        }
        await Task.deleteOne({
            _id:task._id,
        })
        await createAuditLog({
             companyId: req.user.company,
      userId: req.user.id,
      action: "delete",
      resource: "task",
      resourceId: task._id.toString(),
      description: `Deleted task ${task.title}`,
      metadata: {
        projectId: task.project.toString(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};
        