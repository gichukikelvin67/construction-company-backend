//create a reausable audit logger
import mongoose from "mongoose";
import AuditLog, { AuditAction } from "../models/AuditLog.js";

interface CreateAuditLogOptions {
  companyId: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async ({
  companyId,
  userId,
  action,
  resource,
  resourceId,
  description,
  metadata,
  ipAddress,
  userAgent,
}: CreateAuditLogOptions): Promise<void> => {
  try {
    await AuditLog.create({
      company: new mongoose.Types.ObjectId(companyId),
      user: new mongoose.Types.ObjectId(userId),
      action,
      resource,
      resourceId: resourceId
        ? new mongoose.Types.ObjectId(resourceId)
        : undefined,
      description,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Audit logging should not crash the main business operation.
    console.error("Audit log creation failed:", error);
  }
};