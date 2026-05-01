const { analyzeImages } = require("../services/aiService");
const { httpError } = require("../utils/httpError");

const analyzeConstructionImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw httpError(400, "At least one image is required");
    }

    const result = await analyzeImages(req.files);

    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeConstructionImages
};