const {
  createBeam,
  listBeams,
  getBeamById,
  updateBeam,
  deleteBeam
} = require("../services/beamService");
const { httpError } = require("../utils/httpError");

const validateRequiredFields = (payload, requiredFields) => {
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    throw httpError(400, `Missing required fields: ${missingFields.join(", ")}`);
  }
};

const parseBeamId = (rawId) => {
  const beamId = Number(rawId);

  if (!Number.isInteger(beamId) || beamId <= 0) {
    throw httpError(400, "Beam id must be a positive integer");
  }

  return beamId;
};

const createBeamListing = async (req, res, next) => {
  try {
    validateRequiredFields(req.body, ["type", "title", "beam_name", "beam_type"]);
    const beam = await createBeam(req.user, req.body);

    res.status(201).json({
      status: "success",
      data: beam
    });
  } catch (error) {
    next(error);
  }
};

const getBeams = async (req, res, next) => {
  try {
    const beams = await listBeams(req.user);

    res.status(200).json({
      status: "success",
      data: beams
    });
  } catch (error) {
    next(error);
  }
};

const getBeam = async (req, res, next) => {
  try {
    const beamId = parseBeamId(req.params.id);
    const beam = await getBeamById(req.user, beamId);

    res.status(200).json({
      status: "success",
      data: beam
    });
  } catch (error) {
    next(error);
  }
};

const updateBeamListing = async (req, res, next) => {
  try {
    validateRequiredFields(req.body, ["type", "title", "beam_name", "beam_type"]);
    const beamId = parseBeamId(req.params.id);
    const beam = await updateBeam(req.user, beamId, req.body);

    res.status(200).json({
      status: "success",
      data: beam
    });
  } catch (error) {
    next(error);
  }
};

const deleteBeamListing = async (req, res, next) => {
  try {
    const beamId = parseBeamId(req.params.id);
    const result = await deleteBeam(req.user, beamId);

    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBeamListing,
  getBeams,
  getBeam,
  updateBeamListing,
  deleteBeamListing
};
