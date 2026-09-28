import {Response} from "express";
import mongoose from  "mongoose";
import ProjectDocument from "../models/Document.js";
import Project from "../models/Project.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createAuditLog } from "../utils/auditLogger.js";
//create a project document
export const createDocument=async(
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
        const {projectId,name,description,category,fileUrl,fileName,fileType,fileSize}=req.body;
        if(!mongoose.Types.ObjectId.isValid(projectId)){
            res.status(400).json({
                success:false,
                message:"Invalid project ID",
            })
            return;
        }
        //Make sure the project belongs to the logged in user company
        const project=await Project.findOne({
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

        const document=await ProjectDocument.create({
            company:req.user.company,
            project:project._id,
            name,
            description,
            category,
            fileUrl,
            fileName,
            fileType,
            fileSize,
            uploadedBy:req.user.id,
        })
        await createAuditLog({
      companyId:req.user.company,
      userId: req.user.id,
      action: "create",
      resource: "document",
      resourceId: document._id.toString(),
      description: `Created document ${document.name}`,
      metadata: {
        projectId: project._id.toString(),
        category: document.category,
      },

        })
        res.status(200).json({
            success:true,
            message:"Document created successfully",
            document,
        })
    }catch(error){
        console.error("Document creation error:",error);
        res.status(500).json({
            success:false,
            message:"Failed to create document",
        });
    }
}
/**
 * Get project documents
 */
export const getDocuments = async (
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
      category,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const filter: Record<string, unknown> = {
      company: req.user.company,
      isArchived: false,
    };

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

      // Make sure the project belongs to this company
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

    // Filter by category
    if (category) {
      filter.category = String(category).trim();
    }

    // Search document names and descriptions
    if (search) {
      const searchTerm = String(search).trim();

      if (searchTerm) {
        filter.$or = [
          {
            name: {
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
          {
            fileName: {
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

    const [totalDocuments, documents] = await Promise.all([
      ProjectDocument.countDocuments(filter),

      ProjectDocument.find(filter)
        .populate("project", "name status")
        .populate("uploadedBy", "name email role")
        .populate("updatedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit),
    ]);

    const totalPages =
      totalDocuments === 0
        ? 0
        : Math.ceil(totalDocuments / currentLimit);

    res.status(200).json({
      success: true,

      pagination: {
        page: currentPage,
        limit: currentLimit,
        totalDocuments,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },

      documents,
    });
  } catch (error) {
    console.error("Document retrieval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve documents",
    });
  }
};

//get a single document
export const getDocumentById=async(
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
        res.status(404).json({
            success:false,
            message:"Invalid document ID",
        })
        return;
    }

    const document=await ProjectDocument.findOne({
        _id:id,
        company:req.user.company,
        isArchived:false,
    })
    .populate("project","name status")
    .populate("uploadedBy","name email role")
    .populate("updatedBy", "name email role")

    if(!document){
        res.status(404).json({
            success:false,
            message:"Document not found",
        })
        return;
    }
    res.status(200).json({
        success:true,
        document,
    })
}catch(error){
    console.error("Document retrieval error:",error);

    res.status(500).json({
        success:false,
        message:"Failed to retrieve document",
    })
}
};

/**
 * Update document metadata
 */
export const updateDocument = async (
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
        message: "Invalid document ID",
      });
      return;
    }

    const document = await ProjectDocument.findOne({
      _id: id,
      company: req.user.company,
      isArchived: false,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    const { name, description, category } = req.body;

    const previousValues = {
      name: document.name,
      description: document.description,
      category: document.category,
    };

    if (name !== undefined) {
      document.name = name;
    }

    if (description !== undefined) {
      document.description = description;
    }

    if (category !== undefined) {
      document.category = category;
    }

    document.updatedBy = new mongoose.Types.ObjectId(req.user.id);

    await document.save();

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "document",
      resourceId: document._id.toString(),
      description: `Updated document ${document.name}`,
      metadata: {
        previousValues,
        updatedValues: {
          name: document.name,
          description: document.description,
          category: document.category,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    console.error("Document update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update document",
    });
  }
};

/**
 * Archive a document
 */
export const archiveDocument = async (
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
        message: "Invalid document ID",
      });
      return;
    }

    const document = await ProjectDocument.findOne({
      _id: id,
      company: req.user.company,
      isArchived: false,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    document.isArchived = true;
    document.archivedAt = new Date();
    document.archivedBy = new mongoose.Types.ObjectId(req.user.id);

    await document.save();

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "document",
      resourceId: document._id.toString(),
      description: `Archived document ${document.name}`,
      metadata: {
        projectId: document.project.toString(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Document archived successfully",
    });
  } catch (error) {
    console.error("Document archive error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to archive document",
    });
  }
};
/**
 * Restore an archived document
 */
export const restoreDocument = async (
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
        message: "Invalid document ID",
      });
      return;
    }

    const document = await ProjectDocument.findOne({
      _id: id,
      company: req.user.company,
      isArchived: true,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Archived document not found",
      });
      return;
    }

    document.isArchived = false;
    document.archivedAt = undefined;
    document.archivedBy = undefined;
    document.updatedBy = new mongoose.Types.ObjectId(req.user.id);

    await document.save();

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "document",
      resourceId: document._id.toString(),
      description: `Restored document ${document.name}`,
      metadata: {
        projectId: document.project.toString(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Document restored successfully",
      document,
    });
  } catch (error) {
    console.error("Document restore error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to restore document",
    });
  }
};