const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";
const shouldUseSsl = process.env.DB_SSL === "true";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
