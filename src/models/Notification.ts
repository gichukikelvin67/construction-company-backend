import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "invoice"
  | "payment"
  | "purchase_order"
  | "stock"
  | "task"
  | "daily_report"
  | "project"
  | "expense"
  | "system";

export interface INotification extends Document {
  company: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  resource?: string;
  resourceId?: mongoose.Types.ObjectId;
  notificationKey?:string;
  isRead: boolean;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "invoice",
        "payment",
        "purchase_order",
        "stock",
        "task",
        "daily_report",
        "project",
        "expense",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    resource: {
      type: String,
      trim: true,
    },

    resourceId: {
      type: Schema.Types.ObjectId,
    },
    notificationKey: {
  type: String,
  trim: true,
  index: true,
},

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  company: 1,
  user: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  company: 1,
  user: 1,
  createdAt: -1,
});
notificationSchema.index(
  {
    company: 1,
    user: 1,
    notificationKey: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      notificationKey: { $exists: true },
    },
  }
);

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;