import { fileTypeFromBuffer } from "file-type";
import cloudinary from "../config/cloudinary.js";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "png",
  "webp",
]);

export const uploadProfilePhoto = async (
  buffer: Buffer
): Promise<{
  url: string;
  publicId: string;
}> => {
  // Verify the actual file contents.
  const detectedType = await fileTypeFromBuffer(buffer);

  if (
    !detectedType ||
    !ALLOWED_IMAGE_TYPES.has(detectedType.mime) ||
    !ALLOWED_EXTENSIONS.has(detectedType.ext)
  ) {
    throw new Error(
      "Invalid image content. Upload a genuine JPEG, PNG, or WebP image."
    );
  }

  // Upload the verified image to persistent cloud storage.
  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "aesthetics/profile-photos",
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);
          return;
        }

        if (!uploadResult) {
          reject(new Error("Image upload returned no result."));
          return;
        }

        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      }
    );

    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};