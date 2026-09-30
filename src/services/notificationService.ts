import mongoose from "mongoose";
import Notification,{NotificationType}from "../models/Notification.js";

interface CreateNotificationData{
    companyId:string |mongoose.Types.ObjectId;
    userId:string| mongoose.Types.ObjectId;
    type:NotificationType;
    title:string;
    message:string;
    resource?:string;
    resourceId?:string |mongoose.Types.ObjectId;
    notificationKey?:string;
}
export const createNotification=async({
    companyId,
    userId,
    type,
    title,
    message,
    resource,
    resourceId,
    notificationKey,
}:CreateNotificationData)=>{
    const notification=await Notification.create({
        company:companyId,
        user:userId,
        type,
        title,
        message,
        resource,
        resourceId,
        notificationKey,
        isRead:false,
    })
    console.log("NOTIFICATION CREATED:", notification);
    return notification;
};
