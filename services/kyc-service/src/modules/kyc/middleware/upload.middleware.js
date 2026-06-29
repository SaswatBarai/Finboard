import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { isStorageEnabled } from "@finboard/storage";

const repoRoot = fileURLToPath(new URL("../../../../../..", import.meta.url));
const uploadRoot = path.resolve(repoRoot, "infrastructure/storage/uploads/kyc");
fs.mkdirSync(uploadRoot, { recursive: true });

const diskStorage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadRoot);
  },
  filename(req, file, callback) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`);
  }
});

const storage = isStorageEnabled() ? multer.memoryStorage() : diskStorage;

export const kycUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(file.mimetype)) {
      return callback(new Error("Only PNG, JPG, WEBP, or PDF files are allowed"));
    }
    callback(null, true);
  }
});
