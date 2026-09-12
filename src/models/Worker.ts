import mongoose, { Document, Schema } from "mongoose";

export type WorkerStatus =
  | "active"
  | "inactive"
  | "suspended";

export interface IWorker extends Document {
  name: string;
  phone: string;
  email?: string;
  nationalId?: string;
  jobTitle: string;
  dailyRate: number;
  company: mongoose.Types.ObjectId;
  status: WorkerStatus;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdBy: mongoose.Types.ObjectId;
}

const workerSchema = new Schema<IWorker>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },

    nationalId: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    dailyRate: {
      type: Number,
      required: true,
      min: 0,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },

    emergencyContactName: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

workerSchema.index({
  company: 1,
  createdAt: -1,
});

workerSchema.index({
  company: 1,
  status: 1,
});

const Worker = mongoose.model<IWorker>("Worker", workerSchema);

export default Worker;