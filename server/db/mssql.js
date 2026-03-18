// server/db/mssql.js
// SQL Server introspection queries — returns same row shapes as postgres.js

function quoteIdentifier(identifier) {
  return `[${String(identifier).replace(/]/g, ']]')}]`;
}

async function getSchema(pool) {
  if (!pool) throw new Error('DB pool not available');

  // First get column info from INFORMATION_SCHEMA
  const colRes = await pool.request().query(`
    SELECT
      c.TABLE_NAME AS table_name,
      c.COLUMN_NAME AS column_name,
      c.DATA_TYPE AS data_type,
      c.IS_NULLABLE AS is_nullable,
      CAST(0 AS BIT) AS is_primary,
      CAST(0 AS BIT) AS is_foreign,
      NULL AS foreign_table,
      NULL AS foreign_column,
      c.ORDINAL_POSITION AS ordinal_position
    FROM INFORMATION_SCHEMA.COLUMNS c
    INNER JOIN INFORMATION_SCHEMA.TABLES t
      ON c.TABLE_NAME = t.TABLE_NAME
      AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
      AND c.TABLE_CATALOG = t.TABLE_CATALOG
    WHERE t.TABLE_TYPE = 'BASE TABLE'
      AND t.TABLE_CATALOG = DB_NAME()
      AND c.TABLE_SCHEMA = 'dbo'
    ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
  `);

  // Get primary key info
  const pkRes = await pool.request().query(`
    SELECT
      tc.TABLE_NAME AS table_name,
      kcu.COLUMN_NAME AS column_name
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
      ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
    WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      AND tc.TABLE_CATALOG = DB_NAME()
      AND tc.TABLE_SCHEMA = 'dbo'
  `);

  const pkSet = new Set(pkRes.recordset.map((r) => `${r.table_name}.${r.column_name}`));

  // Get foreign key info
  const fkRes = await pool.request().query(`
    SELECT
      tp.name AS parent_table,
      cp.name AS parent_col,
      tr.name AS ref_table,
      cr.name AS ref_col
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
    INNER JOIN sys.columns cp
      ON fkc.parent_object_id = cp.object_id
      AND fkc.parent_column_id = cp.column_id
    INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
    INNER JOIN sys.columns cr
      ON fkc.referenced_object_id = cr.object_id
      AND fkc.referenced_column_id = cr.column_id
    INNER JOIN sys.schemas s ON tp.schema_id = s.schema_id
    WHERE s.name = 'dbo'
  `);

  const fkMap = {};
  for (const row of fkRes.recordset) {
    fkMap[`${row.parent_table}.${row.parent_col}`] = {
      foreign_table: row.ref_table,
      foreign_col: row.ref_col,
    };
  }

  return colRes.recordset.map((row) => {
    const key = `${row.table_name}.${row.column_name}`;
    const fk = fkMap[key];
    return {
      table_name: row.table_name,
      column_name: row.column_name,
      data_type: row.data_type,
      is_nullable: row.is_nullable,
      is_primary: pkSet.has(key),
      is_foreign: !!fk,
      foreign_table: fk ? fk.foreign_table : null,
      foreign_column: fk ? fk.foreign_col : null,
    };
  });
}

async function getTables(pool) {
  if (!pool) throw new Error('DB pool not available');

  const res = await pool.request().query(`
    SELECT TABLE_NAME AS table_name
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_CATALOG = DB_NAME()
      AND TABLE_SCHEMA = 'dbo'
    ORDER BY TABLE_NAME
  `);

  return res.recordset.map((row) => row.table_name);
}

async function getSampleRows(pool, table) {
  if (!pool) throw new Error('DB pool not available');

  const allowedTables = await getTables(pool);
  if (!allowedTables.includes(table)) {
    throw new Error('Invalid table name');
  }

  const tableIdentifier = quoteIdentifier(table);
  const res = await pool.request().query(`SELECT TOP 10 * FROM [dbo].${tableIdentifier}`);
  return res.recordset;
}

async function getRowCounts(pool) {
  if (!pool) throw new Error('DB pool not available');

  const res = await pool.request().query(`
    SELECT
      t.name AS table_name,
      SUM(p.rows) AS row_count
    FROM sys.tables t
    INNER JOIN sys.partitions p ON t.object_id = p.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE p.index_id IN (0, 1)
      AND s.name = 'dbo'
    GROUP BY t.name
    ORDER BY t.name
  `);

  return res.recordset.reduce((acc, row) => {
    acc[row.table_name] = Number(row.row_count);
    return acc;
  }, {});
}

export { getSchema, getTables, getSampleRows, getRowCounts };
