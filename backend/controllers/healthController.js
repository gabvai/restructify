const healthCheck = async (_req, res, next) => {
  try {
    res.status(200).json({
      status: "ok",
      message: "Backend is healthy"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  healthCheck
};
