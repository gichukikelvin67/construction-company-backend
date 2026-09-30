import {Response}from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const getNotifications=async(
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
            isRead,
            page="1",
            limit="20",
        }=req.query;
        const filter:Record<string,unknown>={
            company:req.user.company,
            user:req.user.id,
        };

        //Optional read/unread filter
        if(isRead !==undefined){
            if(isRead !=="true"&&isRead !=="false"){
                res.status(400).json({
                    success:false,
                    message:"isRead must be true or false",
                })
                return;
            }
            filter.isRead=isRead ==="true";
        }
        const currentPage=Math.max(Number(page)|| 1,1);
        const currentLimit=Math.min(
            Math.max(Number(limit)|| 20,1),
            100
        );
        const skip=(currentPage -1)* currentLimit;
        const[totalNotifications,notifications]=await Promise.all([
            Notification.countDocuments(filter),

            Notification.find(filter)
            .populate("user","name email role")
            .sort({createdAt: -1})
            .skip(skip)
            .limit(currentLimit),
        ])
        const totalPages=
        totalNotifications ===0
        ?0
        :Math.ceil(totalNotifications/currentLimit);

        res.status(200).json({
            success:true,
            pagination:{
                page:currentPage,
                limit:currentLimit,
                totalNotifications,
                totalPages,
                hasNextPage:currentPage < totalPages,
                hasPreviousPage:currentPage > 1,
            },
            notifications,
        })
    }catch(error){
        console.error("Notification retrieval error:",error);

        res.status(500).json({
            success:false,
            message:"Failed to retrieve notifications",
        });
    }
}
export const getUnreadNotificationCount=async(
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
        const unreadCount=await Notification.countDocuments({
            company:req.user.company,
            user:req.user.id,
            isRead:false,
        })
        res.status(200).json({
            success:true,
            unreadCount,
        })

    }catch(error){
        console.error("Unread notification count error:",error);
        res.status(500).json({
            success:false,
            message:"Failed to retrieve unread notification count",
        })
        }
    }
    export const markNotificationAsRead=async(
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
                    message:"Invalid notification ID",
                })
                return;
            }
            const notification=await Notification.findOne({
                _id:id,
                company:req.user.company,
                user:req.user.id,
            })
            if(!notification){
                res.status(404).json({
                    success:false,
                    message:"Notification not found",
                })
                return;
            }
            if(!notification.isRead){
                notification.isRead=true;
                notification.readAt=new Date();
                await notification.save();
            }
            res.status(200).json({
                success:true,
                message:"Notification marked as read",
                notification,
            })
        }catch(error){
            console.error("Mark notification as read error:",error);
            res.status(500).json({
                success:false,
                message:"Failed to mark notification as read",
            })
        }
    }
    export const markAllNotificationsAsRead = async (
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

    const result = await Notification.updateMany(
      {
        company: req.user.company,
        user: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

