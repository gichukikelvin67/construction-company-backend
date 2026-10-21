import type { ErrorRequestHandler } from "express";
import multer from "multer";

const profilePhotoErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        message: "Profile photos must be 5 MB or smaller.",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: "The uploaded file could not be accepted.",
    });
    return;
  }

  if (
    error instanceof Error &&
    error.message ===
      "Only JPEG, PNG, and WebP images are allowed."
  ) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  next(error);
};

export default profilePhotoErrorHandler;