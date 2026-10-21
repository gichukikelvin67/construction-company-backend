
import { Request, Response, NextFunction } from "express";
import ContactEnquiry from "../models/ContactEnquiry.js";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { EnquiryStatus } from "../models/ContactEnquiry.js";

const allowedEnquiryTypes = [
  "general",
  "demo",
  "pricing",
  "enterprise",
] as const;

export const createContactEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      fullName,
      email,
      phone,
      companyName,
      enquiryType,
      message,
    } = req.body;

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Full name, email, and message are required.",
      });
      return;
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();

    if (
      !cleanName ||
      cleanName.length > 100 ||
      !cleanEmail ||
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      !cleanMessage ||
      cleanMessage.length > 3000
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide valid contact details and a message.",
      });
      return;
    }

    if (
      typeof enquiryType !== "string" ||
      !allowedEnquiryTypes.includes(
        enquiryType as (typeof allowedEnquiryTypes)[number]
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Please select a valid enquiry type.",
      });
      return;
    }

    if (
      phone !== undefined &&
      (typeof phone !== "string" || phone.trim().length > 30)
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid phone number.",
      });
      return;
    }

    if (
      companyName !== undefined &&
      (typeof companyName !== "string" || companyName.trim().length > 150)
    ) {
      res.status(400).json({
        success: false,
        message: "Company name must be 150 characters or fewer.",
      });
      return;
    }

      const validEnquiryType =
  enquiryType as (typeof allowedEnquiryTypes)[number];

const enquiry = await ContactEnquiry.create({
  fullName: cleanName,
  email: cleanEmail,
  phone: typeof phone === "string" ? phone.trim() : undefined,
  companyName:
    typeof companyName === "string"
      ? companyName.trim()
      : undefined,
  enquiryType: validEnquiryType,
  message: cleanMessage,
});

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us. Your enquiry has been received.",
      data: {
        id: enquiry._id,
        status: enquiry.status,
        createdAt: enquiry.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContactEnquiries = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const enquiries = await ContactEnquiry.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
};

export const getContactEnquiryById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
      return;
    }

    const enquiry = await ContactEnquiry.findById(id).lean();

    if (!enquiry) {
      res.status(404).json({
        success: false,
        message: "Contact enquiry not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const updateContactEnquiryStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses: EnquiryStatus[] = [
      "new",
      "in_progress",
      "responded",
      "closed",
    ];

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
      return;
    }

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status as EnquiryStatus)
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid enquiry status.",
      });
      return;
    }

    const enquiry = await ContactEnquiry.findByIdAndUpdate(
      id,
      { status: status as EnquiryStatus },
      { new: true, runValidators: true }
    ).lean();

    if (!enquiry) {
      res.status(404).json({
        success: false,
        message: "Contact enquiry not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully.",
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

