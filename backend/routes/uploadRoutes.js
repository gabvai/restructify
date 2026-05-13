const express = require("express");

const {
  uploadDrawingHandler,
  uploadListingPhotoHandler
} = require("../controllers/uploadController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadDrawingPdf } = require("../middleware/uploadDrawingMiddleware");
const { uploadListingPhoto } = require("../middleware/uploadListingPhotoMiddleware");

const router = express.Router();

router.use(authenticate);

router.post("/drawings", uploadDrawingPdf, uploadDrawingHandler);
router.post("/photos", uploadListingPhoto, uploadListingPhotoHandler);

module.exports = router;
