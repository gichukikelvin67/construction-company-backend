import mongoose, { Document, Schema } from "mongoose";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "half_day"
  | "leave";

export interface IAttendance extends Document {
  project: mongoose.Types.ObjectId;
  worker: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;

  date: Date;
  status: AttendanceStatus;

  dailyRate: number;
  notes?: string;

  recordedBy: mongoose.Types.ObjectId;
}

const attendanceSchema = new Schema<IAttendance>(
  {
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

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "present",
        "absent",
        "half_day",
        "leave",
      ],
      required: true,
    },

    dailyRate: {
      type: Number,
      required: true,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({
  company: 1,
  project: 1,
  date: -1,
});

attendanceSchema.index({
  company: 1,
  worker: 1,
  date: -1,
});

attendanceSchema.index(
  {
    company: 1,
    project: 1,
    worker: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

const Attendance = mongoose.model<IAttendance>(
  "Attendance",
  attendanceSchema
);

export default Attendance;