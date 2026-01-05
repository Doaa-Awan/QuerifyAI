// server/db/postgres.js
const { Pool } = require("pg");

function createPostgresClient(config) {
  return new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ?? false,
  });
}

async function getSchema(pool) {
  if (!pool || typeof pool.query !== "function") {
    throw new Error("DB pool not available");
  }

  const res = await pool.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  return res.rows;
}

async function getSampleRows(pool, table) {
  if (!pool || typeof pool.query !== "function") {
    throw new Error("DB pool not available");
  }

  const { rows: tables } = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public';
  `);

  const allowedTables = tables.map(t => t.table_name);

  if (!allowedTables.includes(table)) {
    throw new Error("Invalid table name");
  }

  const res = await pool.query(`SELECT * FROM ${table} LIMIT 10`);
  return res.rows;
}

module.exports = {
  createPostgresClient,
  getSchema,
  getSampleRows,
};
