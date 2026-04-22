const jwt = require("jsonwebtoken");

const { httpError } = require("../utils/httpError");

const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw httpError(401, "Missing or invalid authorization header");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw httpError(500, "Missing JWT_SECRET configuration");
    }

    const payload = jwt.verify(token, jwtSecret);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(httpError(401, "Invalid or expired token"));
    }

    return next(error);
  }
};

module.exports = {
  authenticate
};
