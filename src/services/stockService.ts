import mongoose from "mongoose";
import StockMovement from "../models/StockMovement.js";

export const getMaterialStock = async (
  materialId: mongoose.Types.ObjectId | string,
  companyId: mongoose.Types.ObjectId | string
): Promise<number> => {
  const movements = await StockMovement.find({
    material: materialId,
    company: companyId,
  }).select("type adjustmentDirection quantity");

  let currentStock = 0;

  for (const movement of movements) {
    switch (movement.type) {
      case "receipt":
        currentStock += movement.quantity;
        break;

      case "return":
        currentStock += movement.quantity;
        break;

      case "issue":
        currentStock -= movement.quantity;
        break;

      case "adjustment":
        if (movement.adjustmentDirection === "increase") {
          currentStock += movement.quantity;
        } else if (movement.adjustmentDirection === "decrease") {
          currentStock -= movement.quantity;
        }
        break;
    }
  }

  return Math.max(currentStock, 0);
};