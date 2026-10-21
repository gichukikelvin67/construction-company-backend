
import mongoose, { Document, Schema } from "mongoose";

export type EnquiryType =
  | "general"
  | "demo"
  | "pricing"
  | "enterprise";

export type EnquiryStatus =
  | "new"
  | "in_progress"
  | "responded"
  | "closed";

export interface IContactEnquiry extends Document {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  enquiryType: EnquiryType;
  message: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const contactEnquirySchema = new Schema<IContactEnquiry>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    enquiryType: {
      type: String,
      enum: ["general", "demo", "pricing", "enterprise"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "responded", "closed"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IContactEnquiry>(
  "ContactEnquiry",
  contactEnquirySchema
);
