import authRoutes from "./routes/authRoutes.js";
import express from "express";
import cors from  "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import projectRoutes from "./routes/projectRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import projectAssignmentRoutes from "./routes/projectAssignmentRoutes.js";

import attendanceRoutes from "./routes/attendanceRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import projectFinancialRoutes from "./routes/projectFinancialRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import stockMovementRoutes from "./routes/stockMovementRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import dns from "node:dns";
import userRoutes from "./routes/userRoutes.js"
import auditLogRoutes from "./routes/auditLogRoutes.js";
import { env } from "./config/env.js";
import taskRoutes from "./routes/taskRoutes.js";
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);


const app=express();

app.use (
    cors({
        origin:env.FRONTEND_URL,
        credentials:true,
    }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use(
  "/api/project-assignments",
  projectAssignmentRoutes
);
app.use(
  "/api/attendance",
  attendanceRoutes
);

app.use(
  "/api/financials",
  projectFinancialRoutes
);

app.get("/api/health",(_req,res)=>{
    res.json({
        success:true,
        message:"Aesthetic API is running"
    })
})
app.use("/api/auth", authRoutes);
export default app;