import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

interface JwtPayload{
    userId:string;
    iat?:number;
}

export interface AuthenticatedRequest extends Request{
    user?:{
        id:string;
        role: string;
        company:string;
    }
}

const getAccessTokenSecret=(): string => {
    const secret=process.env.JWT_SECRET;

    if(!secret){
        throw new Error("JWT_SECRET  is not defined");
    }

    return secret;
}

export const protect=async(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
):  Promise<void> =>{
    try{
        const authorization=req.headers.authorization;
//check that authorizartion header exists
// and starts with Berarer
        if(!authorization || !authorization.startsWith("Bearer")){
            res.status(401).json({
                success:false,
                message:"Authentication required",
            })

            return;
        }
//remove bearer and keep only JWT
        const token=authorization.slice(7).trim();
        if(!token){
            res.status(401).json({
                success:false,
                message: "Authentication required",
            })
            return;
        }
        const secret=getAccessTokenSecret();
        console.log("Verify secret loaded:",Boolean(secret));

        const decoded=jwt.verify(
            token,
            secret
        ) as JwtPayload;

        const user=await User.findById(decoded.userId);

        if(!user){
            res.status(401).json({
                success:false,
                message: "User no longer exists",
            })
            return;
        }

        if(!user.isActive){
            res.status(403).json({
                success:false,
                message:"Your account has been disabled",
            })
            return;
        }

        if(user.passwordChangedAt && decoded.iat){
            const passwordChangedAt=user.passwordChangedAt.getTime();
            const tokenIssuedAt=decoded.iat *1000;

            if(tokenIssuedAt < passwordChangedAt){
                res.status(401).json({
                    success:false,
                    messsage:"Session is no longer valid.Please log in again.",
                })
                return;
            }
        }

        req.user={
            id:user._id.toString(),
            role: user.role,
            company:user.company.toString(),

        }
        next();
    }catch(error){
        console.error("Authentication error:",error);

        res.status(401).json({
            success:false,
            message:
            error instanceof Error
            ? error.message
            :"Invalid or expired access token",
        })
    }
}