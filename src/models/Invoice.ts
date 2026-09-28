import mongoose,{Document,Schema}from "mongoose";

export type InvoiceStatus=
|"draft"
|"issued"
|"partially_paid"
|"paid"
|"overdue"
|"cancelled"

export type InvoiceType=
|"supplier"
|"client"
|"project";

export interface IInvoice extends Document{
 company: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;

  invoiceNumber: string;
  type: InvoiceType;

  description?: string;

  issueDate: Date;
  dueDate?: Date;

  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;

  status: InvoiceStatus;

  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;

  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
}
const invoiceSchema = new Schema<IInvoice>(
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
      index: true,
    },

    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: ["supplier", "client", "project"],
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    issueDate: {
      type: Date,
      required: true,
    },

    dueDate: {
      type: Date,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    taxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "issued",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      default: "draft",
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    archivedAt: {
      type: Date,
    },

    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({
  company: 1,
  invoiceNumber: 1,
});

invoiceSchema.index({
  company: 1,
  project: 1,
  status: 1,
});

invoiceSchema.index({
  company: 1,
  supplier: 1,
  status: 1,
});

const Invoice = mongoose.model<IInvoice>(
  "Invoice",
  invoiceSchema
);

export default Invoice;