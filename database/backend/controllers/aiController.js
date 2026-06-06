const { analyzeImages } = require("../services/aiService");
const { httpError } = require("../utils/httpError");

const MAX_AI_IMAGES = 5;

const pickAnalysisOptions = (query) => ({
  debug: query.debug,
  material_confidence: query.material_confidence,
  overlap_threshold: query.overlap_threshold,
  min_material_area_fraction: query.min_material_area_fraction,
  rust_min_area: query.rust_min_area,
  rust_full_penalty_percent: query.rust_full_penalty_percent,
  bend_full_penalty_threshold: query.bend_full_penalty_threshold
});

const analyzeConstructionImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw httpError(400, "At least one image is required");
    }

    if (req.files.length > MAX_AI_IMAGES) {
      throw httpError(400, `You can upload at most ${MAX_AI_IMAGES} images at once`);
    }

    const result = await analyzeImages(req.files, pickAnalysisOptions(req.query));

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
