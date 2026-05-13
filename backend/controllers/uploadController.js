const { httpError } = require("../utils/httpError");

const uploadDrawingHandler = (req, res, next) => {
  try {
    if (!req.file) {
      throw httpError(400, "Neperduotas failas.");
    }

    const url = `/uploads/drawings/${req.file.filename}`;

    res.status(201).json({
      status: "success",
      data: { url }
    });
  } catch (error) {
    next(error);
  }
};

const uploadListingPhotoHandler = (req, res, next) => {
  try {
    if (!req.file) {
      throw httpError(400, "Neperduotas failas.");
    }

    const url = `/uploads/listing-images/${req.file.filename}`;

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
