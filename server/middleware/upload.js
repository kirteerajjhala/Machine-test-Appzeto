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
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  callback(null, allowed.includes(file.mimetype));
};

export const productImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

export const productImageFields = (req, res, next) => {
  productImageUpload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};
