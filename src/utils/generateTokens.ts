import jwt from "jsonwebtoken";
import{env}from "../config/env.js";

const getAccessTokenSecret=(): string=>env.JWT_SECRET;
const getRefreshTokenSecret= (): string =>env.JWT_REFRESH_SECRET;

export const generateAccessToken=(userId:string): string =>
    jwt.sign({userId},getAccessTokenSecret(),{expiresIn:"15m"});


export const generateRefreshToken=(userId: string): string =>
    jwt.sign({userId},getRefreshTokenSecret(),{expiresIn:"7d"})