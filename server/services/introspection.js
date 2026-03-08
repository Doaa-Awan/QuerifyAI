import { getSchema, getTables, getSampleRows, getRowCounts } from '../db/postgres.js';
import { sanitizeSamples } from './postgres.service.js';

function groupSchemaByTable(schemaRows) {
  return schemaRows.reduce((acc, row) => {
    if (!acc[row.table_name]) acc[row.table_name] = [];
    acc[row.table_name].push(row);
    return acc;
  }, {});
}

function buildColumns(tableRows, tableSamples) {
  return tableRows.map((row) => {
    const sampleValues = tableSamples
      .map((sampleRow) => sampleRow[row.column_name])
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v));

    return {
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      isPrimaryKey: row.is_primary === true,
      isForeignKey: row.is_foreign === true,
      sampleValues,
    };
  });
}

function buildForeignKeys(tableRows) {
  return tableRows
    .filter((row) => row.is_foreign && row.foreign_table && row.foreign_column)
    .map((row) => ({
      column: row.column_name,
      referencedTable: row.foreign_table,
      referencedColumn: row.foreign_column,
    }));
}

export const introspectionService = {
  async introspect(pool) {
    const [schemaRows, tableNames, rowCountMap] = await Promise.all([
      getSchema(pool),
      getTables(pool),
      getRowCounts(pool),
    ]);

    const rawSamples = {};
    for (const tableName of tableNames) {
      rawSamples[tableName] = await getSampleRows(pool, tableName);
    }

    const sanitized = sanitizeSamples(schemaRows, rawSamples);
    const grouped = groupSchemaByTable(schemaRows);

    const tables = tableNames.map((name) => ({
      name,
      description: '',
      columns: buildColumns(grouped[name] ?? [], sanitized[name] ?? []),
      primaryKey: (grouped[name] ?? []).find((r) => r.is_primary)?.column_name ?? null,
      foreignKeys: buildForeignKeys(grouped[name] ?? []),
      rowCount: rowCountMap[name] ?? 0,
    }));

    return { tables };
  },
};
