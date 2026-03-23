// application logic

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { conversationRepository } from '../repositories/conversation.repository.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _client = null;
function getClient() {
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return _client;
}

const tableMetadataPath = path.resolve(__dirname, '../prompts/table-metadata.json');

// Per-conversation cache: conversationId -> { query: string, tables: string[] }
const topicCache = new Map();
const MAX_TOPIC_CACHE = 100;

const DIALECT_LABEL = {
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  sqlserver: 'SQL Server',
  mssql: 'SQL Server',
  mysql: 'MySQL',
};

async function buildInstructions(schemaOverride, dialect) {
  const template = await fs.readFile(path.resolve(__dirname, '../prompts/chatbot.txt'), 'utf8');
  const dbSchema = schemaOverride ?? await fs.readFile(path.resolve(__dirname, '../prompts/db-explorer-context.md'), 'utf8');
  const dialectLabel = DIALECT_LABEL[dialect] ?? 'SQL';
  return template.replace('{{dbSchema}}', dbSchema).replace('{{dialect}}', dialectLabel);
}

async function loadTableMetadata() {
  try {
    const content = await fs.readFile(tableMetadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Heuristic: detect if the current query is a follow-up to the previous one.
// Returns true when the query contains follow-up language or is very short.
function isFollowUpQuery(query) {
  const lower = query.toLowerCase().trim();
  const followUpWords = [
    'those', 'they', 'it ', 'these', 'that ', 'same',
    ' also', 'additionally', 'furthermore', 'what about',
  ];
  if (followUpWords.some((w) => lower.includes(w))) return true;
  if (lower.split(/\s+/).length <= 3) return true;
  return false;
}

// Pass 1: ask the model which tables are needed for the given query.
// Returns a validated string[] on success, or null to signal fallback.
async function selectRelevantTables(query, tableMetadata) {
  const knownTables = Object.keys(tableMetadata);

  const tableList = knownTables
    .map((name) => {
      const { description, columns } = tableMetadata[name];
      const colNames = columns.map((c) => c.column_name).join(', ');
      return `- ${name}: ${description || `columns: ${colNames}`}`;
    })
    .join('\n');

  const prompt = `You are a database query router. Given a user query, return a JSON array of table names needed to answer it.

Tables:
${tableList}

Query: "${query}"

Respond with ONLY a JSON array of relevant table names, e.g. ["table1", "table2"]. Return [] if no tables are clearly relevant.`;

  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 50,
    });

    const content = response.choices?.[0]?.message?.content ?? '[]';
    const jsonStr = content.replace(/```(?:json)?\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((name) => knownTables.includes(name));
  } catch {
    return null;
  }
}

function formatCell(v) {
  if (v === null || v === undefined) return '`null`';
  return `\`${String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ')}\``;
}

// Build a focused schema context string from stored metadata for the given tables only.
function buildPartialSchemaContext(relevantTables, tableMetadata) {
  const lines = ['## Relevant Table Details', ''];

  for (const tableName of relevantTables) {
    const meta = tableMetadata[tableName];
    if (!meta) continue;

    lines.push(`### ${tableName}`, '');
    if (meta.description) lines.push(meta.description, '');

    lines.push('Columns:', '');
    if (meta.columns.length === 0) {
      lines.push('- No columns found.', '');
    } else {
      lines.push('| Name | Type | Keys | References |');
      lines.push('|---|---|---|---|');
      for (const column of meta.columns) {
        const keys = [column.is_primary ? 'PK' : '', column.is_foreign ? 'FK' : ''].filter(Boolean).join(', ') || '-';
        const ref =
          column.is_foreign && column.foreign_table && column.foreign_column
            ? `${column.foreign_table}.${column.foreign_column}`
            : '-';
        lines.push(`| ${column.column_name} | ${column.data_type} | ${keys} | ${ref} |`);
      }
    }

    lines.push('', 'Top 10 records:', '');
    const rows = meta.sampleRows ?? [];
    if (rows.length === 0) {
      lines.push('_No rows found._', '');
      continue;
    }

    const headers = Object.keys(rows[0]);
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
    for (const row of rows) {
      lines.push(`| ${headers.map((col) => formatCell(row[col])).join(' | ')} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Public interface
export const chatService = {
  async sendMessage(prompt, conversationId, dialect) {
    const tableMetadata = await loadTableMetadata();
    let schemaContext = null; // null means use full schema (fallback)

    if (tableMetadata) {
      const cached = topicCache.get(conversationId);
      const isCacheHit = cached && isFollowUpQuery(prompt);

      let relevantTables;
      if (isCacheHit) {
        relevantTables = cached.tables;
        console.log('[chat] cache hit → reusing tables:', relevantTables);
      } else {
        const newTables = await selectRelevantTables(prompt, tableMetadata);
        console.log('[chat] pass 1 result:', newTables);
        if (newTables && cached) {
          relevantTables = [...new Set([...cached.tables, ...newTables])];
          console.log('[chat] merged with cached tables:', relevantTables);
        } else {
          relevantTables = newTables;
        }
      }

      if (relevantTables && relevantTables.length > 0) {
        schemaContext = buildPartialSchemaContext(relevantTables, tableMetadata);
        if (!isCacheHit) {
          if (topicCache.size >= MAX_TOPIC_CACHE) {
          topicCache.delete(topicCache.keys().next().value);
        }
        topicCache.set(conversationId, { query: prompt, tables: relevantTables });
        }
      } else {
        console.log('[chat] fallback → using full schema');
      }
    } else {
      console.log('[chat] no table-metadata.json → using full schema');
    }

    const instructions = await buildInstructions(schemaContext ?? undefined, dialect);
    const recentMessages = conversationRepository.getRecentMessages(conversationId, 10);
    const messages = [
      { role: 'system', content: instructions },
      ...recentMessages,
      { role: 'user', content: prompt },
    ];

    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      max_tokens: 800,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'query_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              sql: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              explanation: { type: 'string' },
              tables_used: { type: 'array', items: { type: 'string' } },
            },
            required: ['sql', 'explanation', 'tables_used'],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content ?? '';

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { sql: null, explanation: rawContent, tables_used: [] };
    }

    // Store the raw JSON string so follow-up context is preserved
    conversationRepository.appendMessage(conversationId, 'user', prompt);
    conversationRepository.appendMessage(conversationId, 'assistant', rawContent);

    return {
      id: response.id,
      sql: parsed.sql ?? null,
      explanation: parsed.explanation ?? '',
      tables_used: Array.isArray(parsed.tables_used) ? parsed.tables_used : [],
    };
  },
};
