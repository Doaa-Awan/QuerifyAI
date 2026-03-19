// application logic
// SQL Server connection and introspection service

import sql from 'mssql';
import { getSchema as fetchSchema, getSampleRows, getTables, getRowCounts } from '../db/mssql.js';
import { schemaStore } from './schemaStore.js';
import { mssqlRepository } from '../repositories/mssql.repository.js';
import { queryCache } from './cache.js';
import {
  sanitizeSamples,
  buildSnapshotMarkdown,
  generateTableDescriptions,
  writeTableMetadata,
  clearExplorerSnapshotFile,
} from './postgres.service.js';
import { introspectionService } from './introspection.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const explorerPromptPath = path.resolve(__dirname, '../prompts/db-explorer-context.md');

function isMissingRequiredConfig(config) {
  return !config || !config.server || !config.user || !config.database;
}

function createMssqlClient(config) {
  return new sql.ConnectionPool({
    server: config.server,
    port: config.port ? Number(config.port) : 1433,
    user: config.user,
    password: config.password || '',
    database: config.database,
    options: {
      instanceName: config.instanceName || undefined,
      trustServerCertificate: config.trustServerCertificate !== false,
      encrypt: config.encrypt !== false,
    },
    connectionTimeout: 15000,
    requestTimeout: 30000,
  });
}

async function testAndSetDb(config) {
  if (!config) return { ok: false, error: 'No config provided' };

  if (isMissingRequiredConfig(config)) {
    return { ok: false, error: 'Server, user and database are required' };
  }

  let candidatePool;
  try {
    candidatePool = createMssqlClient(config);
    await candidatePool.connect();
    await candidatePool.request().query('SELECT 1 AS test');
    await mssqlRepository.replacePool(candidatePool);
    return { ok: true };
  } catch (err) {
    try {
      if (candidatePool) await candidatePool.close();
    } catch (closeErr) {
      /* ignore */
    }
    return { ok: false, error: err.message };
  }
}

async function writeMssqlExplorerSnapshot(pool) {
  const schemaRows = await fetchSchema(pool);
  const tables = await getTables(pool);
  console.log('[snapshot:mssql] tables found:', tables);

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
  console.log('[snapshot:mssql] db-explorer-context.md written');

  let descriptions = {};
  try {
    descriptions = await generateTableDescriptions(tables, schemaRows);
  } catch (err) {
    console.warn('[snapshot:mssql] description generation failed:', err.message);
  }
  await writeTableMetadata({ tables, schemaRows, tableSamples, descriptions });
}

// Public interface
export const mssqlService = {
  async connectDemo() {
    const demoCfg = {
      server: process.env.DEMO_DB_HOST_SQL,
      user: process.env.DEMO_DB_USER_SQL,
      password: process.env.DEMO_DB_PASSWORD_SQL,
      database: process.env.DEMO_DB_NAME_SQL,
    };

    if (isMissingRequiredConfig(demoCfg)) {
      return { ok: false, error: 'Demo SQL Server credentials are not configured on the server', status: 400 };
    }

    try { await clearExplorerSnapshotFile(); } catch { /* non-fatal */ }

    const result = await testAndSetDb(demoCfg);
    if (!result.ok) return { ok: false, error: result.error, status: 500 };

    queryCache.clear();
    return { ok: true };
  },

  async connect(config) {
    if (isMissingRequiredConfig(config)) {
      return { ok: false, error: 'Server, user and database are required', status: 400 };
    }

    try { await clearExplorerSnapshotFile(); } catch { /* non-fatal */ }

    const result = await testAndSetDb(config);
    if (!result.ok) return { ok: false, error: result.error, status: 500 };

    queryCache.clear();
    return { ok: true };
  },

  getStatus() {
    return { available: mssqlRepository.isAvailable() };
  },

  async getHealth() {
    const pool = mssqlRepository.getPool();
    if (!pool || !mssqlRepository.isAvailable()) {
      return { ok: false, status: 503, body: { status: 'unavailable', error: 'SQL Server connection not available' } };
    }

    try {
      const result = await pool.request().query('SELECT GETDATE() AS now');
      return { ok: true, body: { status: 'ok', time: result.recordset[0].now } };
    } catch (err) {
      return { ok: false, status: 500, body: { error: err.message } };
    }
  },

  async getSchema() {
    const pool = mssqlRepository.getPool();
    if (!pool || !mssqlRepository.isAvailable()) {
      return { ok: false, status: 503, body: { error: 'SQL Server connection not available' } };
    }

    try {
      const schema = await fetchSchema(pool);
      return { ok: true, body: schema };
    } catch (err) {
      return { ok: false, status: 500, body: { error: err.message } };
    }
  },

  async buildExplorerSnapshot() {
    const pool = mssqlRepository.getPool();
    if (!pool || !mssqlRepository.isAvailable()) {
      return { ok: false, status: 503, body: { error: 'SQL Server connection not available' } };
    }

    try {
      await writeMssqlExplorerSnapshot(pool);
      return { ok: true, body: { message: 'DB explorer context generated', path: 'server/prompts/db-explorer-context.md' } };
    } catch (err) {
      return { ok: false, status: 500, body: { error: err.message } };
    }
  },

  async clearExplorerSnapshot() {
    try {
      await clearExplorerSnapshotFile();
      return { ok: true, body: { message: 'DB explorer context cleared' } };
    } catch (err) {
      return { ok: false, status: 500, body: { error: err.message } };
    }
  },
};
