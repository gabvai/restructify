const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const multer = require("multer");

const { httpError } = require("../utils/httpError");

const uploadsRoot = path.join(__dirname, "..", "uploads");
const drawingsDir = path.join(uploadsRoot, "drawings");

fs.mkdirSync(drawingsDir, { recursive: true });

const maxBytes = Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, drawingsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const suffix = ext === ".pdf" ? ".pdf" : ".pdf";
    const base = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    cb(null, `${base}${suffix}`);
  }
});

const drawingUpload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfName = file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdfMime || isPdfName) {
      cb(null, true);
      return;
    }
    cb(httpError(400, "Leidžiami tik PDF failai."));
  }
});

const uploadDrawingPdf = (req, res, next) => {
  drawingUpload.single("file")(req, res, (err) => {
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
  uploadDrawingPdf
};
