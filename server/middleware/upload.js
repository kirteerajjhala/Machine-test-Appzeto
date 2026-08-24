import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDirectory = path.resolve("uploads", "products");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(
      null,
      `product-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
    );
  },
});

const fileFilter = (req, file, callback) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
    "image/svg+xml",
  ];
  if (allowed.includes(file.mimetype) || file.mimetype?.startsWith("image/")) {
    callback(null, true);
  } else {
    callback(null, true);
  }
};

export const productImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const productImageFields = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return next();
  }
  productImageUpload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: err.code || "UPLOAD_ERROR",
          message: err.message || "Invalid file upload",
        },
      });
    }
    next();
  });
};
