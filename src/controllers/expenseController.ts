import {Response} from "express";
import mongoose from "mongoose";

import Expense from "../models/Expense.js";
import Project from "../models/Project.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";


export const createExpense=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void> =>{
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
            category,
            description,
            amount,
            expenseDate,
            receiptNumber,
            notes,
        }=req.body;


        if(!mongoose.Types.ObjectId.isValid(projectId)){
            res.status(400).json({
                success:false,
                message:"Invalid project ID",
            })
            return;
        }

        //make sure the project belongs to logged-in user company

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

    const expense=await Expense.create({
        project:projectId,
        company:req.user.company,
        category,
        description,
        amount,
        expenseDate:new Date(expenseDate),
        receiptNumber,
        notes,
        recordedBy:req.user.id,
    });
    res.status(201).json({
        success:true,
        message:"Expense recorded successfully",
        expense,
    })

    }catch(error){
        console.error("Create expense error:",error);

        res.status(500).json({
            success:false,
            message:"Unable to record expense",
        })
    }
}

export const getProjectExpenses=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void> =>{
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
            res.status(400).json({
                success:false,
                message:"Project not found",
            })
            return;
        }

        const expenses=await Expense.find({
            project:projectId,
            company:req.user.company,
        })
        .populate("recordedBy", "name email")
        .sort({ expenseDate: -1, createdAt: -1});


        const totalAmount=expenses.reduce(
            (total,expense)=>total +expense.amount,0
        )

        res.status(200).json({
            success:true,
            project:{
                id:project._id,
                name:project.name,
            },
            count:expenses.length,
            totalAmount,
            expenses,
        })
    }catch(error){
        console.error("Get project exxpenses error:",error);

        res.status(500).json({
            success:false,
            message:"Unable to get project expenses",
        })
    }
}

export const updateExpense = async (
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

    const expenseId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
      return;
    }

    const expense= await Expense.findOne({
      _id: expenseId,
      company: req.user.company,
      isVoided:false,
    });

    if (!expense) {
      res.status(404).json({
        success: false,
        message: "Expense not found",
      });
      return;
    }

    const {
      category,
      description,
      amount,
      expenseDate,
      receiptNumber,
      notes,
    } = req.body;

    if (category !== undefined) {
      expense.category = category;
    }

    if (description !== undefined) {
      expense.description = description;
    }

    if (amount !== undefined) {
      expense.amount = amount;
    }

    if (expenseDate !== undefined) {
      expense.expenseDate = new Date(expenseDate);
    }

    if (receiptNumber !== undefined) {
      expense.receiptNumber = receiptNumber;
    }

    if (notes !== undefined) {
      expense.notes = notes;
    }

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update expense error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update expense",
    });
  }
};

export const voidExpense = async (
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

    const expenseId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
      return;
    }

    const { reason } = req.body;

    const expense = await Expense.findOne({
      _id: expenseId,
      company: req.user.company,
    });

    if (!expense) {
      res.status(404).json({
        success: false,
        message: "Expense not found",
      });
      return;
    }

    if (expense.isVoided) {
      res.status(400).json({
        success: false,
        message: "Expense has already been voided",
      });
      return;
    }

    expense.isVoided = true;
    expense.voidedAt = new Date();
    expense.voidedBy = new mongoose.Types.ObjectId(req.user.id);
    expense.voidReason = reason;

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Expense voided successfully",
      expense,
    });
  } catch (error) {
    console.error("Void expense error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to void expense",
    });
  }
};