const {
  listPendingConstructions,
  reviewConstruction
} = require("../services/constructionReviewService");
const { httpError } = require("../utils/httpError");

const parseConstructionId = (rawId) => {
  const constructionId = Number(rawId);

  if (!Number.isInteger(constructionId) || constructionId <= 0) {
    throw httpError(400, "Construction id must be a positive integer");
  }

  return constructionId;
};

const getPendingConstructions = async (_req, res, next) => {
  try {
    const constructions = await listPendingConstructions();

    res.status(200).json({
      status: "success",
      data: constructions
    });
  } catch (error) {
    next(error);
  }
};

const reviewConstructionById = async (req, res, next) => {
  try {
    const constructionId = parseConstructionId(req.params.id);
    const { status, review_comment } = req.body;

    if (!status) {
      throw httpError(400, "status is required");
    }

    const construction = await reviewConstruction(constructionId, req.user.id, {
      status,
      review_comment
    });

    res.status(200).json({
      status: "success",
      data: construction
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingConstructions,
  reviewConstructionById
};
