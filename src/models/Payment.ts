import mongoose ,{Document, Schema}from "mongoose";

export type PaymentMethod=
|"cash"
|"bank_transfer"
|"mpesa"
|"card"
|"cheque";
export interface IPayment extends Document {
  company: mongoose.Types.ObjectId;

  invoice: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;

  paymentReference: string;
  amount: number;
  paymentDate: Date;
  method: PaymentMethod;

  notes?: string;

  recordedBy: mongoose.Types.ObjectId;
}
const paymentSchema = new Schema<IPayment>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
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

    paymentReference: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentDate: {
      type: Date,
      required: true,
    },

    method: {
      type: String,
      enum: [
        "cash",
        "bank_transfer",
        "mpesa",
        "card",
        "cheque",
      ],
      required: true,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
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

paymentSchema.index({
  company: 1,
  invoice: 1,
  paymentDate: -1,
});

paymentSchema.index({
  company: 1,
  paymentReference: 1,
});

const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);

export default Payment;

