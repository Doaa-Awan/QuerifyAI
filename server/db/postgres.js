// server/db/postgres.js
async function getSchema(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new Error('DB pool not available');
  }

  const res = await pool.query(`
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      BOOL_OR(tc.constraint_type = 'PRIMARY KEY') AS is_primary,
      BOOL_OR(tc.constraint_type = 'FOREIGN KEY') AS is_foreign,
      MAX(CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.table_name END) AS foreign_table,
      MAX(CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.column_name END) AS foreign_column
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
    GROUP BY c.table_name, c.column_name, c.data_type, c.is_nullable, c.ordinal_position
    ORDER BY c.table_name, c.ordinal_position;
  `);
  return res.rows;
}

async function getTables(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new Error('DB pool not available');
  }

  const res = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  return res.rows.map((row) => row.table_name);
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

async function getSampleRows(pool, table) {
  if (!pool || typeof pool.query !== 'function') {
    throw new Error('DB pool not available');
  }

  const allowedTables = await getTables(pool);

  if (!allowedTables.includes(table)) {
    throw new Error('Invalid table name');
  }

  const tableIdentifier = quoteIdentifier(table);
  const res = await pool.query(`SELECT * FROM public.${tableIdentifier} LIMIT 10`);
  return res.rows;
}

async function getRowCounts(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new Error('DB pool not available');
  }
  const res = await pool.query(`
    SELECT relname AS table_name, n_live_tup AS row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY relname
  `);
  return res.rows.reduce((acc, row) => {
    acc[row.table_name] = Number(row.row_count);
    return acc;
  }, {});
}

export { getSchema, getSampleRows, getTables, getRowCounts };
