import { Router } from "express";
// @ts-ignore
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma.js";
import { uploadToCloudinary } from "../utils/upload.js";
import { checkAuth } from "../middlewares/auth.js";

const router = Router();

// Ensure upload directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // Global max size 20MB
  }
});

router.post("/upload", checkAuth, upload.single("file"), async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;
  const fileSize = req.file.size;

  try {
    // 1. Validate file size and type
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    if (!isImage && !isPdf) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Invalid file type. Only images and PDFs are allowed." });
    }

    if (isImage && fileSize > 2 * 1024 * 1024) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Image size cannot exceed 2MB" });
    }

    if (isPdf && fileSize > 20 * 1024 * 1024) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: "PDF size cannot exceed 20MB" });
    }

    // 2. Compute file hash (SHA-256)
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    const fileHash = hashSum.digest("hex");

    // 3. Check for duplicates in DB
    const existingAsset = await prisma.media_assets.findFirst({
      where: {
        hash: fileHash,
        deleted_at: null
      }
    });

    const userId = Number(req.user.user_id);

    if (existingAsset) {
      // Delete local file immediately since we reuse the existing URL
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Create new reference for this user in DB
      const newAsset = await prisma.media_assets.create({
        data: {
          user_id: userId,
          file_url: existingAsset.file_url,
          file_type: mimeType,
          file_size: fileSize,
          hash: fileHash
        }
      });

      return res.json({
        success: true,
        url: existingAsset.file_url,
        asset: newAsset,
        duplicate: true
      });
    }

    // 4. Upload to Cloudinary (will delete local file upon success)
    const uploadResult = await uploadToCloudinary(filePath);

    // 5. Store in database
    const newAsset = await prisma.media_assets.create({
      data: {
        user_id: userId,
        file_url: uploadResult.url,
        file_type: mimeType,
        file_size: fileSize,
        hash: fileHash
      }
    });

    return res.json({
      success: true,
      url: uploadResult.url,
      asset: newAsset,
      duplicate: false
    });
  } catch (error: any) {
    console.error("Error during media upload:", error);
    // Clean up if file still exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
