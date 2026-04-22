const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { pool } = require("../db");
const { httpError } = require("../utils/httpError");

const DEFAULT_USER_ROLE = "user";

const toSafeUser = (userRow) => ({
  id: userRow.id,
  email: userRow.email,
  name: userRow.name,
  phone: userRow.phone,
  role: userRow.role,
  created_at: userRow.created_at
});

const createAuthToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw httpError(500, "Missing JWT_SECRET configuration");
  }

  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
};

const registerUser = async ({ email, password, name, phone }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUserResult = await pool.query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [normalizedEmail]
  );

  if (existingUserResult.rowCount > 0) {
    throw httpError(409, "Email is already registered");
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const insertResult = await pool.query(
    `
      INSERT INTO users (email, password_hash, name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, phone, role, created_at
    `,
    [normalizedEmail, passwordHash, name, phone, DEFAULT_USER_ROLE]
  );

  const user = toSafeUser(insertResult.rows[0]);
  const token = createAuthToken(user);

  return { user, token };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const userResult = await pool.query(
    `
      SELECT id, email, password_hash, name, phone, role, created_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizedEmail]
  );

  if (userResult.rowCount === 0) {
    throw httpError(401, "Invalid email or password");
  }

  const userRow = userResult.rows[0];
  const isPasswordValid = await bcrypt.compare(password, userRow.password_hash);

  if (!isPasswordValid) {
    throw httpError(401, "Invalid email or password");
  }

  const user = toSafeUser(userRow);
  const token = createAuthToken(user);

  return { user, token };
};

module.exports = {
  registerUser,
  loginUser
};
