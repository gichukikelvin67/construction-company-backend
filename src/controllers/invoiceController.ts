import{Response}from "express";
import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Project from "../models/Project.js";
import Supplier from "../models/Supplier.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createAuditLog } from "../utils/auditLogger.js";;
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";

export const createInvoice=async(
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
            projectId,
            supplierId,
            invoiceNumber,
            type,
            description,
            issueDate,
            dueDate,
            subtotal,
            taxAmount,
        }=req.body;
        //Make sure projct belongs to user company

        let project: mongoose.HydratedDocument<any> | null = null;
        if(projectId){
            if(!mongoose.Types.ObjectId.isValid(projectId)){
                res.status(400).json({
                    success:false,
                    message:"Invalid project ID",
                })
                return;
            }
            project=await Project.findOne({
                _id:projectId,
                company:req.user.company,
            })
            if(!project){
                res.status(404).json({
                    success:false,
                    message:"Project not found",
                })
                return;
            }
        }

        let supplier: mongoose.HydratedDocument<any> | null = null;
        if(supplierId){
            if(!mongoose.Types.ObjectId.isValid(supplierId)){
                res.status(400).json({
                    success:false,
                    message:"Invalid supplier ID",
                })
                return;
            }
            supplier=await Supplier.findOne({
                _id:supplierId,
                company:req.user.company,
            });
            if(!supplier){
                res.status(404).json({
                    success:false,
                    message:"Supplier not found"
                })
                return;
            }
        }
        //Prevent duplicate invoice numbers within the company
        const existingInvoice=await Invoice.findOne({
            company:req.user.company,
            invoiceNumber,
        })
        if(existingInvoice){
            res.status(409).json({
                success:false,
                message:"An invoice with this number already exists",
            })
            return;
        }
        //Calculate financila values on the server
        const calculatedTax=taxAmount?? 0;
        const totalAmount=subtotal + calculatedTax;

        const invoice=await Invoice.create({
      company: req.user.company,
      project: project?._id,
      supplier: supplier?._id,

      invoiceNumber,
      type,
      description,

      issueDate: new Date(issueDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,

      subtotal,
      taxAmount: calculatedTax,
      totalAmount,

      amountPaid: 0,
      amountDue: totalAmount,

      status: "draft",

      createdBy: req.user.id,

        })
        await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "create",
      resource: "invoice",
      resourceId: invoice._id.toString(),
      description: `Created invoice ${invoice.invoiceNumber}`,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        projectId: project?._id.toString(),
        supplierId: supplier?._id.toString(),
      },
    });
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

const notificationMessage = `Invoice ${invoice.invoiceNumber} has been created for KES ${invoice.totalAmount.toLocaleString()}.`;

await Promise.allSettled(
  usersToNotify.map((user) =>
    createNotification({
      companyId: req.user!.company,
      userId: user._id,
      type: "invoice",
      title: "New Invoice Created",
      message: notificationMessage,
      resource: "invoice",
      resourceId: invoice._id,
    })
  )
);

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error("Invoice creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
    });
  }
};
/**
 * Get invoices
 */
export const getInvoices = async (
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
      projectId,
      supplierId,
      type,
      status,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const filter: Record<string, unknown> = {
      company: req.user.company,
      isArchived: false,
    };

    // Project filter
    if (projectId) {
      const projectIdString = String(projectId).trim();

      if (!mongoose.Types.ObjectId.isValid(projectIdString)) {
        res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
        return;
      }

      const project = await Project.findOne({
        _id: projectIdString,
        company: req.user.company,
      });

      if (!project) {
        res.status(404).json({
          success: false,
          message: "Project not found",
        });
        return;
      }

      filter.project = new mongoose.Types.ObjectId(projectIdString);
    }

    // Supplier filter
    if (supplierId) {
      const supplierIdString = String(supplierId).trim();

      if (!mongoose.Types.ObjectId.isValid(supplierIdString)) {
        res.status(400).json({
          success: false,
          message: "Invalid supplier ID",
        });
        return;
      }

      const supplier = await Supplier.findOne({
        _id: supplierIdString,
        company: req.user.company,
      });

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
        return;
      }

      filter.supplier = new mongoose.Types.ObjectId(supplierIdString);
    }

    // Invoice type filter
    if (type) {
      filter.type = String(type).trim();
    }

    // Invoice status filter
    if (status) {
      filter.status = String(status).trim();
    }

    // Search by invoice number or description
    if (search) {
      const searchTerm = String(search).trim();

      if (searchTerm) {
        filter.$or = [
          {
            invoiceNumber: {
              $regex: searchTerm,
              $options: "i",
            },
          },
          {
            description: {
              $regex: searchTerm,
              $options: "i",
            },
          },
        ];
      }
    }

    const currentPage = Math.max(Number(page) || 1, 1);

    const currentLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip = (currentPage - 1) * currentLimit;

    const [totalInvoices, invoices] = await Promise.all([
      Invoice.countDocuments(filter),

      Invoice.find(filter)
        .populate("project", "name status")
        .populate("supplier", "name phone email")
        .populate("createdBy", "name email role")
        .populate("updatedBy", "name email role")
        .sort({ issueDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(currentLimit),
    ]);

    const totalPages =
      totalInvoices === 0
        ? 0
        : Math.ceil(totalInvoices / currentLimit);

    res.status(200).json({
      success: true,

      pagination: {
        page: currentPage,
        limit: currentLimit,
        totalInvoices,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },

      invoices,
    });
  } catch (error) {
    console.error("Invoice retrieval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve invoices",
    });
  }
};
/**
 * Get a single invoice
 */
export const getInvoiceById = async (
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
        message: "Invalid invoice ID",
      });
      return;
    }

    const invoice = await Invoice.findOne({
      _id: id,
      company: req.user.company,
      isArchived: false,
    })
      .populate("project", "name status")
      .populate("supplier", "name phone email")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!invoice) {
      res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Invoice retrieval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice",
    });
  }
};
/**
 * Update invoice metadata/status
 */
export const updateInvoice = async (
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
        message: "Invalid invoice ID",
      });
      return;
    }

    const invoice = await Invoice.findOne({
      _id: id,
      company: req.user.company,
      isArchived: false,
    });

    if (!invoice) {
      res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
      return;
    }

    const { description, dueDate, status } = req.body;

    // Once payments have been recorded, financial values
    // should not be manually changed through this endpoint.
    if (description !== undefined) {
      invoice.description = description;
    }

    if (dueDate !== undefined) {
      const newDueDate = new Date(dueDate);

      if (newDueDate < invoice.issueDate) {
        res.status(400).json({
          success: false,
          message: "Due date cannot be before issue date",
        });
        return;
      }

      invoice.dueDate = newDueDate;
    }

    if (status !== undefined) {
      // Do not allow manually marking an invoice as paid.
      if (status === "paid" || status === "partially_paid") {
        res.status(400).json({
          success: false,
          message:
            "Payment status is updated automatically when payments are recorded",
        });
        return;
      }

      invoice.status = status;
    }

    invoice.updatedBy = new mongoose.Types.ObjectId(req.user.id);

    await invoice.save();

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "invoice",
      resourceId: invoice._id.toString(),
      description: `Updated invoice ${invoice.invoiceNumber}`,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
      },
    });

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Invoice update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update invoice",
    });
  }
};
/**
 * Archive an invoice
 */
export const archiveInvoice = async (
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
        message: "Invalid invoice ID",
      });
      return;
    }

    const invoice = await Invoice.findOne({
      _id: id,
      company: req.user.company,
      isArchived: false,
    });

    if (!invoice) {
      res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
      return;
    }

    // Do not allow invoices with outstanding balances
    // to be archived accidentally.
    if (invoice.amountDue > 0 && invoice.status !== "cancelled") {
      res.status(400).json({
        success: false,
        message:
          "Invoices with an outstanding balance cannot be archived",
      });
      return;
    }

    invoice.isArchived = true;
    invoice.archivedAt = new Date();
    invoice.archivedBy = new mongoose.Types.ObjectId(req.user.id);

    await invoice.save();

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "invoice",
      resourceId: invoice._id.toString(),
      description: `Archived invoice ${invoice.invoiceNumber}`,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    res.status(200).json({
      success: true,
      message: "Invoice archived successfully",
    });
  } catch (error) {
    console.error("Invoice archive error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to archive invoice",
    });
  }
};


    