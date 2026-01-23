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
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      tc.constraint_type = 'PRIMARY KEY' AS is_primary,
      tc.constraint_type = 'FOREIGN KEY' AS is_foreign,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu
      ON c.table_name = kcu.table_name
      AND c.column_name = kcu.column_name
      AND c.table_schema = kcu.table_schema
    LEFT JOIN information_schema.table_constraints tc
      ON kcu.constraint_name = tc.constraint_name
      AND kcu.table_schema = tc.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position;
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
