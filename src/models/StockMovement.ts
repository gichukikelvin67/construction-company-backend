import mongoose, { Document, Schema } from "mongoose";

export type StockMovementType =
  | "receipt"
  | "issue"
  | "return"
  | "adjustment";


  export type StockAdjustmentDirection= "increase" | "decrease";

export interface IStockMovement extends Document {
  material: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;

  company: mongoose.Types.ObjectId;

  type: StockMovementType;

  adjustmentDirection?:StockAdjustmentDirection;
  quantity: number;
  unitCost?: number;

  referenceNumber?: string;
  notes?: string;

  movementDate: Date;

  createdBy: mongoose.Types.ObjectId;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    material: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },

    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "receipt",
        "issue",
        "return",
        "adjustment",
      ],
      required: true,
      index: true,
    },
      
    adjustmentDirection: {
  type: String,
  enum: ["increase", "decrease"],
},

    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },

    unitCost: {
      type: Number,
      min: 0,
    },

    referenceNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    movementDate: {
      type: Date,
      required: true,
      index: true,
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

stockMovementSchema.index({
  company: 1,
  material: 1,
  movementDate: -1,
});

stockMovementSchema.index({
  company: 1,
  project: 1,
  movementDate: -1,
});

stockMovementSchema.index({
  company: 1,
  type: 1,
  movementDate: -1,
});

stockMovementSchema.index(
  { company: 1, type: 1, referenceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      referenceNumber: { $exists: true, $type: "string" },
    },
  }
);

const StockMovement = mongoose.model<IStockMovement>(
  "StockMovement",
  stockMovementSchema
);

export default StockMovement;