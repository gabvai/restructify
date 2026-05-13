const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const multer = require("multer");

const { httpError } = require("../utils/httpError");

const uploadsRoot = path.join(__dirname, "..", "uploads");
const listingImagesDir = path.join(uploadsRoot, "listing-images");

fs.mkdirSync(listingImagesDir, { recursive: true });

const maxBytes = Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024);

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, listingImagesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = allowedExtensions.has(ext) ? ext : ".jpg";
    const base = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    cb(null, `${base}${safeExt}`);
  }
});

const listingPhotoUpload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    const extOk = allowedExtensions.has(ext);
    if (mimeOk || extOk) {
      cb(null, true);
      return;
    }
    cb(httpError(400, "Leidžiami tik JPG, PNG, WEBP arba GIF failai."));
  }
});

const uploadListingPhoto = (req, res, next) => {
  listingPhotoUpload.single("file")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(httpError(413, "Failas didesnis nei leistinas dydis."));
        return;
      }
      next(httpError(400, err.message));
      return;
    }

    next(err);
  });
};

module.exports = {
  uploadListingPhoto
};
