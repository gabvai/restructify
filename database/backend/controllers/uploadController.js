const { httpError } = require("../utils/httpError");
const {
  isSupabaseStorageEnabled,
  uploadListingImage,
  uploadDrawingPdf
} = require("../services/supabaseStorage");

const uploadDrawingHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw httpError(400, "Neperduotas failas.");
    }

    let url;
    if (isSupabaseStorageEnabled()) {
      url = await uploadDrawingPdf(req.file);
    } else {
      url = `/uploads/drawings/${req.file.filename}`;
    }

    res.status(201).json({
      status: "success",
      data: { url }
    });
  } catch (error) {
    next(error);
  }
};

const uploadListingPhotoHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw httpError(400, "Neperduotas failas.");
    }

    let url;
    if (isSupabaseStorageEnabled()) {
      url = await uploadListingImage(req.file);
    } else {
      url = `/uploads/listing-images/${req.file.filename}`;
    }

    res.status(201).json({
      status: "success",
      data: { url }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDrawingHandler,
  uploadListingPhotoHandler
};
