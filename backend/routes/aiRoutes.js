const express = require("express");
const multer = require("multer");

const { analyzeConstructionImages } = require("../controllers/aiController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 10 * 1024 * 1024
  }
});

router.use(authenticate);

router.post(
  "/analyze",
  upload.array("images", 10),
  analyzeConstructionImages
);

module.exports = router;
