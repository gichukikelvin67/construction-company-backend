import mongoose, { Document, Schema } from "mongoose";

export type WorkerAssignmentStatus =
  | "active"
  | "completed"
  | "cancelled";

export interface IWorkerAssignment extends Document {
  company: mongoose.Types.ObjectId;

  project: mongoose.Types.ObjectId;

  worker: mongoose.Types.ObjectId;

  roleOnProject: string;

  startDate: Date;

  endDate?: Date;

  agreedDailyRate: number;

  status: WorkerAssignmentStatus;

  assignedBy: mongoose.Types.ObjectId;
}

const workerAssignmentSchema = new Schema<IWorkerAssignment>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    worker: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
      index: true,
    },

    roleOnProject: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
    },

    agreedDailyRate: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },

    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Quickly find workers assigned to a project
workerAssignmentSchema.index({
  company: 1,
  project: 1,
  status: 1,
});

// Quickly find projects belonging to a worker
workerAssignmentSchema.index({
  company: 1,
  worker: 1,
  status: 1,
});

// Prevent the same worker from being actively assigned
// to the same project more than once.
workerAssignmentSchema.index(
  {
    company: 1,
    project: 1,
    worker: 1,
  },
  {
    unique: true,
  }
);

const WorkerAssignment = mongoose.model<IWorkerAssignment>(
  "WorkerAssignment",
  workerAssignmentSchema
);

export default WorkerAssignment;