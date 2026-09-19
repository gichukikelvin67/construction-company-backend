import{Response}from "express";
import AuditLog from "../models/AuditLog.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const getAuditLogs=async(
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
        const auditLogs=await AuditLog.find({
            company:req.user.company,
        })
        .populate("user","name email role")
        .sort({ createdAt: -1})
        .limit(100);

        res.status(200).json({
            success:true,
            count:auditLogs.length,
            auditLogs,
        });
    }catch(error){
        console.error("Get audit logs error:",error);

        res.status(500).json({
            success:false,
            message:"Failed to retrieve audit logs",
        })
    }
}