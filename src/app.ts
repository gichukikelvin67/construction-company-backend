import authRoutes from "./routes/authRoutes.js";
import express from "express";
import cors from  "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import projectRoutes from "./routes/projectRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";

const dns=require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);


const app=express();

app.use (
    cors({
        origin:"http://localhost:3000",
        credentials:true,
    }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/workers", workerRoutes);

app.get("/api/health",(_req,res)=>{
    res.json({
        success:true,
        message:"Aesthetic API is running"
    })
})
app.use("/api/auth", authRoutes);
export default app;