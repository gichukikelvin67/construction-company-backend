import mongoose from "mongoose";
import {env}from "./env.js";

const connectDatabase = async (): Promise<void> => {
  const mongoUri = env.MONGODB_URI;

  

  try {
    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDatabase;