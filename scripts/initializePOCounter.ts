import "dotenv/config";

import mongoose from "mongoose";
import Counter from "../src/models/Counter.js";
import PurchaseOrder from "../src/models/PurchaseOrder.js";

const initializePOCounter = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB");

    const purchaseOrders = await PurchaseOrder.find(
      {},
      {
        company: 1,
        poNumber: 1,
      }
    );

    const companyCounters = new Map<string, number>();

    for (const purchaseOrder of purchaseOrders) {
      const poNumber = purchaseOrder.poNumber;

      const match = poNumber.match(/^PO-(\d+)$/);

      if (!match) {
        console.log(
          `Skipping invalid PO number: ${poNumber}`
        );

        continue;
      }

      const sequence = Number(match[1]);

      const companyId =
        purchaseOrder.company.toString();

      const currentHighest =
        companyCounters.get(companyId) || 0;

      if (sequence > currentHighest) {
        companyCounters.set(
          companyId,
          sequence
        );
      }
    }

    for (const [
      companyId,
      highestSequence,
    ] of companyCounters) {
      await Counter.findOneAndUpdate(
        {
          company: new mongoose.Types.ObjectId(companyId),
          name: "purchase_order",
        },
        {
          $set: {
            sequence: highestSequence,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      console.log(
        `Company ${companyId}: PO counter initialized at ${highestSequence}`
      );
    }

    console.log(
      "PO counter initialization completed"
    );
  } catch (error) {
    console.error(
      "Failed to initialize PO counter:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

initializePOCounter();