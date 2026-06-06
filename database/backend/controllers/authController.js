const { registerUser, loginUser } = require("../services/authService");
const { httpError } = require("../utils/httpError");

const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      throw httpError(400, "email, password and name are required");
    }

    const result = await registerUser({ email, password, name, phone: phone || null });

    res.status(201).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw httpError(400, "email and password are required");
    }

    const result = await loginUser({ email, password });

    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
};
