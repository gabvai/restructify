require("dotenv").config();

const { Pool } = require("pg");

const getRequiredEnvString = (name) => {
  const rawValue = process.env[name];

  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return rawValue;
};

const dbHost = getRequiredEnvString("DB_HOST");
const dbUser = getRequiredEnvString("DB_USER");
const dbPassword = getRequiredEnvString("DB_PASSWORD");
const dbName = getRequiredEnvString("DB_NAME");
const dbPort = Number(process.env.DB_PORT || "5432");

if (!Number.isInteger(dbPort) || dbPort <= 0) {
  throw new Error("Invalid DB_PORT. It must be a positive integer.");
}

const isProduction = process.env.NODE_ENV === "production";
const shouldUseSsl = process.env.DB_SSL === "true";

// Temporary debug logs for environment loading verification.
console.log("[db] Environment loaded:", {
  DB_HOST: dbHost,
  DB_PORT: dbPort,
  DB_USER: dbUser,
  DB_NAME: dbName,
  DB_SSL: shouldUseSsl,
  DB_PASSWORD_EXISTS: Boolean(dbPassword)
});

const pool = new Pool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: String(dbPassword),
  database: dbName,
  ssl: shouldUseSsl ? { rejectUnauthorized: isProduction } : false
});

const testDbConnection = async () => {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  testDbConnection
};
