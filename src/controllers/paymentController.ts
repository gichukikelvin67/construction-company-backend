import { Response } from "express";
import mongoose from "mongoose";

import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { createNotification } from "../services/notificationService.js";
import User from "../models/User.js";


 // Record a payment against an invoice

export const createPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const {
      invoiceId,
      paymentReference,
      amount,
      paymentDate,
      method,
      notes,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
      return;
    }

    session.startTransaction();

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      company: req.user.company,
      isArchived: false,
    }).session(session);

    if (!invoice) {
      await session.abortTransaction();

      res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
      return;
    }

    if (invoice.status === "cancelled") {
      await session.abortTransaction();

      res.status(400).json({
        success: false,
        message: "Cannot record a payment for a cancelled invoice",
      });
      return;
    }

    if (amount > invoice.amountDue) {
      await session.abortTransaction();

      res.status(400).json({
        success: false,
        message: "Payment amount cannot exceed the outstanding balance",
      });
      return;
    }

    const payment = new Payment({
      company: req.user.company,
      invoice: invoice._id,
      project: invoice.project,
      supplier: invoice.supplier,
      paymentReference,
      amount,
      paymentDate: new Date(paymentDate),
      method,
      notes,
      recordedBy: req.user.id,
    });

    await payment.save({ session });

    invoice.amountPaid += amount;
    invoice.amountDue = Math.max(
      invoice.totalAmount - invoice.amountPaid,
      0
    );

    if (invoice.amountDue === 0) {
      invoice.status = "paid";
    } else if (invoice.amountPaid > 0) {
      invoice.status = "partially_paid";
    }

    invoice.updatedBy = new mongoose.Types.ObjectId(req.user.id);

    await invoice.save({ session });

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "create",
      resource: "payment",
      resourceId: payment._id.toString(),
      description: `Recorded payment ${payment.paymentReference}`,
      metadata: {
        invoiceId: invoice._id.toString(),
        amount: payment.amount,
        method: payment.method,
      },
    });

    await session.commitTransaction();
    // Create notifications after the payment transaction succeeds
const usersToNotify = await User.find({
  company: req.user.company,
  role: {
    $in: ["admin", "accountant", "project_manager"],
  },
  isActive: true,
  _id: {
    $ne: req.user.id,
  },
}).select("_id role");

const notificationMessage = `Payment of KES ${payment.amount.toLocaleString()} was received for invoice ${invoice.invoiceNumber}.`;

await Promise.allSettled(
  usersToNotify.map((user) =>
    createNotification({
      companyId: req.user!.company,
      userId: user._id,
      type: "payment",
      title: "Payment Received",
      message: notificationMessage,
      resource: "payment",
      resourceId: payment._id,
    })
  )
);

session.endSession();
    

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment,
      invoice: {
        id: invoice._id,
        totalAmount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        amountDue: invoice.amountDue,
        status: invoice.status,
      },
    });
  } catch (error) {
    if(session.inTransaction()){
    await session.abortTransaction();
    }
    console.error("Payment creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  } finally {
    await session.endSession();
  }
};


 // Get payment history
 
export const getPayments = async (
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

    const {
      invoiceId,
      projectId,
      supplierId,
      method,
      page = "1",
      limit = "20",
    } = req.query;

    const filter: Record<string, unknown> = {
      company: req.user.company,
    };

    // Filter by invoice
    if (invoiceId) {
      const invoiceIdString = String(invoiceId).trim();

      if (!mongoose.Types.ObjectId.isValid(invoiceIdString)) {
        res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
        return;
      }

      const invoice = await Invoice.findOne({
        _id: invoiceIdString,
        company: req.user.company,
      });

      if (!invoice) {
        res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
        return;
      }

      filter.invoice = new mongoose.Types.ObjectId(invoiceIdString);
    }

    // Filter by project
    if (projectId) {
      const projectIdString = String(projectId).trim();

      if (!mongoose.Types.ObjectId.isValid(projectIdString)) {
        res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
        return;
      }

      filter.project = new mongoose.Types.ObjectId(projectIdString);
    }

    // Filter by supplier
    if (supplierId) {
      const supplierIdString = String(supplierId).trim();

      if (!mongoose.Types.ObjectId.isValid(supplierIdString)) {
        res.status(400).json({
          success: false,
          message: "Invalid supplier ID",
        });
        return;
      }

      filter.supplier = new mongoose.Types.ObjectId(supplierIdString);
    }

    // Filter by payment method
    if (method) {
      filter.method = String(method).trim();
    }

    const currentPage = Math.max(Number(page) || 1, 1);

    const currentLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip = (currentPage - 1) * currentLimit;

    const [totalPayments, payments] = await Promise.all([
      Payment.countDocuments(filter),

      Payment.find(filter)
        .populate(
          "invoice",
          "invoiceNumber totalAmount amountPaid amountDue status"
        )
        .populate("project", "name status")
        .populate("supplier", "name phone email")
        .populate("recordedBy", "name email role")
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(currentLimit),
    ]);

    const totalPages =
      totalPayments === 0
        ? 0
        : Math.ceil(totalPayments / currentLimit);

    res.status(200).json({
      success: true,

      pagination: {
        page: currentPage,
        limit: currentLimit,
        totalPayments,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },

      payments,
    });
  } catch (error) {
    console.error("Payment retrieval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve payments",
    });
  }
};

 // Get a single payment
 
export const getPaymentById = async (
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

    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
      return;
    }

    const payment = await Payment.findOne({
      _id: id,
      company: req.user.company,
    })
      .populate(
        "invoice",
        "invoiceNumber totalAmount amountPaid amountDue status"
      )
      .populate("project", "name status")
      .populate("supplier", "name phone email")
      .populate("recordedBy", "name email role");

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Payment retrieval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment",
    });
  }
};