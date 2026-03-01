// application logic

import { Pool } from 'pg';
import { getSchema as fetchSchema, getSampleRows, getTables } from '../db/postgres.js';
import { postgresRepository } from '../repositories/postgres.repository.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const explorerPromptPath = path.resolve(__dirname, '../prompts/db-explorer-context.md');
const tableMetadataPath = path.resolve(__dirname, '../prompts/table-metadata.json');

function isMissingRequiredConfig(config) {
  return !config || !config.host || !config.user || !config.database;
}

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

async function testAndSetDb(config) {
  if (!config) return { ok: false, error: 'No config provided' };

  if (isMissingRequiredConfig(config)) {
    return { ok: false, error: 'Host, user and database are required' };
  }

  if (config.password !== undefined && typeof config.password !== 'string') {
    return { ok: false, error: 'DB password must be a string' };
  }

  let candidatePool;
  try {
    candidatePool = createPostgresClient(config);
    await candidatePool.query('SELECT 1');
    await postgresRepository.replacePool(candidatePool);
    return { ok: true };
  } catch (err) {
    try {
      if (candidatePool) await candidatePool.end();
    } catch (closeErr) {
      /* ignore */
    }
    return { ok: false, error: err.message };
  }
}

function formatScalar(value) {
  if (value === null || value === undefined) return '`null`';
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'bigint') return `\`${String(value)}\``;
  if (value instanceof Date) return `\`${value.toISOString()}\``;
  return `\`${String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ')}\``;
}

function isDateType(columnMeta) {
  const dataType = String(columnMeta?.data_type || '').toLowerCase();
  return dataType.includes('date') || dataType.includes('time');
}

function looksLikeEmail(value) {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikePhone(value) {
  if (typeof value !== 'string') return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function isLikelyPiiColumn(columnMeta, columnName, value) {
  const name = String(columnName || '').toLowerCase();

  if (columnMeta?.is_primary) return false;
  if (isDateType(columnMeta)) return false;

  const piiNamePatterns = [
    'name',
    'email',
    'phone',
    'mobile',
    'ssn',
    'social_security',
    'passport',
    'first_name',
    'lastname',
    'last_name',
    'fullname',
    'full_name',
    'middle_name',
    'dob',
    'birth',
    'address',
    'street',
    'city',
    'state',
    'zip',
    'postal',
    'country',
    'username',
    'user_name',
    'password',
    'passcode',
    'token',
    'secret',
    'api_key',
  ];

  if (piiNamePatterns.some((pattern) => name.includes(pattern))) {
    return true;
  }

  if (looksLikeEmail(value) || looksLikePhone(value)) {
    return true;
  }

  return false;
}

function buildDummyValue(columnName, value, rowIndex) {
  const name = String(columnName || '').toLowerCase();
  const n = rowIndex + 1;

  if (value === null || value === undefined) return value;

  if (name.includes('email')) return `user${n}@example.com`;
  if (name.includes('phone') || name.includes('mobile')) return `555010${String(n).padStart(3, '0')}`;
  if (name.includes('first_name')) return `FirstName${n}`;
  if (name.includes('last_name') || name.includes('lastname')) return `LastName${n}`;
  if (name.includes('full_name') || name.includes('fullname')) return `Person ${n}`;
  if (name === 'name' || name.endsWith('_name')) return `Name${n}`;
  if (name.includes('address') || name.includes('street')) return `${100 + n} Example St`;
  if (name.includes('city')) return `City${n}`;
  if (name.includes('state')) return `State${n}`;
  if (name.includes('zip') || name.includes('postal')) return `000${String(n).padStart(2, '0')}`;
  if (name.includes('country')) return `Country${n}`;
  if (name.includes('username') || name.includes('user_name')) return `user_${n}`;
  if (name.includes('password') || name.includes('passcode') || name.includes('token') || name.includes('secret')) {
    return `redacted_${n}`;
  }

  if (typeof value === 'string') return `redacted_${n}`;
  if (typeof value === 'number') return n;
  if (typeof value === 'bigint') return BigInt(n);
  if (typeof value === 'boolean') return false;

  return value;
}

function sanitizeSamples(schemaRows, tableSamples) {
  const columnMetaMap = schemaRows.reduce((acc, row) => {
    if (!acc[row.table_name]) {
      acc[row.table_name] = {};
    }
    acc[row.table_name][row.column_name] = row;
    return acc;
  }, {});

  const sanitized = {};

  for (const [tableName, rows] of Object.entries(tableSamples)) {
    const tableColumnMeta = columnMetaMap[tableName] || {};

    sanitized[tableName] = rows.map((row, rowIndex) => {
      const nextRow = { ...row };

      for (const [columnName, value] of Object.entries(nextRow)) {
        const columnMeta = tableColumnMeta[columnName];
        if (isLikelyPiiColumn(columnMeta, columnName, value)) {
          nextRow[columnName] = buildDummyValue(columnName, value, rowIndex);
        }
      }

      return nextRow;
    });
  }

  return sanitized;
}

function buildSnapshotMarkdown({ generatedAt, tables, schemaRows, tableSamples }) {
  const groupedColumns = schemaRows.reduce((acc, row) => {
    if (!acc[row.table_name]) {
      acc[row.table_name] = [];
    }
    acc[row.table_name].push(row);
    return acc;
  }, {});

  const relationshipRows = schemaRows
    .filter((row) => row.is_foreign)
    .map((row) => `${row.table_name}.${row.column_name} -> ${row.foreign_table}.${row.foreign_column}`);

  const uniqueRelationships = [...new Set(relationshipRows)].sort((a, b) => a.localeCompare(b));

  const lines = [
    '# Database Explorer Context',
    '',
    `Generated: ${generatedAt.toISOString()}`,
    '',
    '## Tables',
    '',
  ];

  if (tables.length === 0) {
    lines.push('No tables found in `public` schema.');
  } else {
    for (const tableName of tables) {
      lines.push(`- ${tableName}`);
    }
  }

  lines.push('', '## Relationships', '');

  if (uniqueRelationships.length === 0) {
    lines.push('No foreign key relationships found.');
  } else {
    for (const relation of uniqueRelationships) {
      lines.push(`- ${relation}`);
    }
  }

  lines.push('', '## Table Details', '');

  for (const tableName of tables) {
    const columns = groupedColumns[tableName] || [];
    const sampleRows = tableSamples[tableName] || [];

    lines.push(`### ${tableName}`, '', 'Columns:', '');
    if (columns.length === 0) {
      lines.push('- No columns found.');
    } else {
      lines.push('| Name | Type | Keys | References |');
      lines.push('|---|---|---|---|');
      for (const column of columns) {
        const keys = [column.is_primary ? 'PK' : '', column.is_foreign ? 'FK' : ''].filter(Boolean).join(', ') || '-';
        const ref =
          column.is_foreign && column.foreign_table && column.foreign_column
            ? `${column.foreign_table}.${column.foreign_column}`
            : '-';
        lines.push(`| ${column.column_name} | ${column.data_type} | ${keys} | ${ref} |`);
      }
    }

    lines.push('', 'Top 10 records:', '');
    if (sampleRows.length === 0) {
      lines.push('_No rows found._');
      lines.push('');
      continue;
    }

    const headerColumns = Object.keys(sampleRows[0]);
    lines.push(`| ${headerColumns.join(' | ')} |`);
    lines.push(`| ${headerColumns.map(() => '---').join(' | ')} |`);
    for (const row of sampleRows) {
      const values = headerColumns.map((col) => formatScalar(row[col]));
      lines.push(`| ${values.join(' | ')} |`);
    }
    lines.push('');
  }

  lines.push('', '_This file is auto-generated and cleared when DB Explorer is exited._', '');
  return lines.join('\n');
}

async function generateTableDescriptions(tables, schemaRows) {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  console.log('[snapshot] generating descriptions for tables:', tables);

  const tableList = tables
    .map((tableName) => {
      const cols = schemaRows
        .filter((r) => r.table_name === tableName)
        .map((r) => r.column_name)
        .join(', ');
      return `- ${tableName}: columns are ${cols}`;
    })
    .join('\n');

  const prompt = `For each database table below, write one concise sentence describing what it stores. Respond with ONLY a JSON object mapping table names to descriptions, e.g. {"table1": "Stores ...", "table2": "Tracks ..."}.

Tables:
${tableList}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
  });

  const content = response.choices?.[0]?.message?.content ?? '{}';
  const jsonStr = content.replace(/```(?:json)?\n?|\n?```/g, '').trim();
  const descriptions = JSON.parse(jsonStr);
  console.log('[snapshot] descriptions received:', descriptions);
  return descriptions;
}

async function writeTableMetadata({ tables, schemaRows, tableSamples, descriptions }) {
  const metadata = {};
  for (const tableName of tables) {
    metadata[tableName] = {
      description: descriptions[tableName] ?? '',
      columns: schemaRows.filter((r) => r.table_name === tableName),
      sampleRows: tableSamples[tableName] ?? [],
    };
  }
  await fs.writeFile(tableMetadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log('[snapshot] table-metadata.json written →', tableMetadataPath);
}

async function writeExplorerSnapshot(pool) {
  const schemaRows = await fetchSchema(pool);
  const tables = await getTables(pool);
  console.log('[snapshot] tables found:', tables);
  const rawTableSamples = {};

  for (const tableName of tables) {
    rawTableSamples[tableName] = await getSampleRows(pool, tableName);
  }

  const tableSamples = sanitizeSamples(schemaRows, rawTableSamples);

  const markdown = buildSnapshotMarkdown({
    generatedAt: new Date(),
    tables,
    schemaRows,
    tableSamples,
  });

  await fs.mkdir(path.dirname(explorerPromptPath), { recursive: true });
  await fs.writeFile(explorerPromptPath, markdown, 'utf8');
  console.log('[snapshot] db-explorer-context.md written');

  let descriptions = {};
  try {
    descriptions = await generateTableDescriptions(tables, schemaRows);
  } catch (err) {
    console.warn('[snapshot] description generation failed, writing metadata without descriptions:', err.message);
  }
  await writeTableMetadata({ tables, schemaRows, tableSamples, descriptions });
}

async function clearExplorerSnapshotFile() {
  await fs.mkdir(path.dirname(explorerPromptPath), { recursive: true });
  await fs.writeFile(explorerPromptPath, '', 'utf8');
  try {
    await fs.unlink(tableMetadataPath);
  } catch {
    // File may not exist, that's fine
  }
}

// Public interface
export const postgresService = {
  async connectDemo() {
    const demoCfg = {
      host: process.env.DEMO_DB_HOST,
      port: process.env.DEMO_DB_PORT,
      user: process.env.DEMO_DB_USER,
      password: process.env.DEMO_DB_PASSWORD,
      database: process.env.DEMO_DB_NAME,
      ssl: process.env.DEMO_DB_SSL === 'true' || false,
    };

    if (isMissingRequiredConfig(demoCfg)) {
      return { ok: false, error: 'Demo DB credentials are not configured on the server', status: 400 };
    }

    const result = await testAndSetDb(demoCfg);
    if (result.ok) {
      return { ok: true };
    }

    return { ok: false, error: result.error, status: 500 };
  },
  async connect(config) {
    if (isMissingRequiredConfig(config)) {
      return { ok: false, error: 'Host, user and database are required', status: 400 };
    }

    const result = await testAndSetDb(config);
    if (result.ok) {
      return { ok: true };
    }

    return { ok: false, error: result.error, status: 500 };
  },
  getStatus() {
    return { available: postgresRepository.isAvailable() };
  },
  async getHealth() {
    const pool = postgresRepository.getPool();
    if (!pool || !postgresRepository.isAvailable()) {
      return { ok: false, status: 503, body: { status: 'unavailable', error: 'DB connection not available' } };
    }

    try {
      const result = await pool.query('SELECT NOW()');
      return { ok: true, body: { status: 'ok', time: result.rows[0].now } };
    } catch (err) {
      return { ok: false, status: 500, body: { error: err.message } };
    }
  },
  async getSchema() {
    const pool = postgresRepository.getPool();
    if (!pool || !postgresRepository.isAvailable()) {
      return { ok: false, status: 503, body: { error: 'DB connection not available' } };
    }

    try {
      const schema = await fetchSchema(pool);
      return { ok: true, body: schema };
    } catch (err) {
      return { ok: false, status: 500, body: { error: err.message } };
    }
  },
  async buildExplorerSnapshot() {
    const pool = postgresRepository.getPool();
    if (!pool || !postgresRepository.isAvailable()) {
      return { ok: false, status: 503, body: { error: 'DB connection not available' } };
    }

    try {
      await writeExplorerSnapshot(pool);
      return { ok: true, body: { message: 'DB explorer context generated', path: 'server/prompts/db-explorer-context.md' } };
    } catch (err) {
      return { ok: false, status: 500, body: { error: err.message } };
    }
  },
  async clearExplorerSnapshot() {
    try {
      await clearExplorerSnapshotFile();
      return { ok: true, body: { message: 'DB explorer context cleared', path: 'server/prompts/db-explorer-context.md' } };
    } catch (err) {
      return { ok: false, status: 500, body: { error: err.message } };
    }
  },
};
