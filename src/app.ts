import authRoutes from "./routes/authRoutes.js";
import express from "express";
import cors from  "cors";
import helmet from "helmet";

const dns=require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);


const app=express();

app.use (cors());
app.use(helmet());
app.use(express.json());


app.get("/api/health",(_req,res)=>{
    res.json({
        success:true,
        message:"Aesthetic API is running"
    })
})
app.use("/api/auth", authRoutes);
export default app;