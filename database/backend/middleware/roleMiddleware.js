const { httpError } = require("../utils/httpError");

const forbidRoles = (roles) => (req, _res, next) => {
  if (!req.user) {
    return next(httpError(401, "Authentication required"));
  }

  if (roles.includes(req.user.role)) {
    return next(httpError(403, "You do not have permission for this action"));
  }

  return next();
};

const allowRoles = (roles) => (req, _res, next) => {
  if (!req.user) {
    return next(httpError(401, "Authentication required"));
  }

  if (!roles.includes(req.user.role)) {
    return next(httpError(403, "You do not have permission for this action"));
  }

  return next();
};

module.exports = {
  forbidRoles,
  allowRoles
};
