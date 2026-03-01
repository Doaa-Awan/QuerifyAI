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

// Implementation detail
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const tableMetadataPath = path.resolve(__dirname, '../prompts/table-metadata.json');

// Per-conversation cache: conversationId -> { query: string, tables: string[] }
const topicCache = new Map();

async function buildInstructions(schemaOverride) {
  const template = await fs.readFile(path.resolve(__dirname, '../prompts/chatbot.txt'), 'utf8');
  const dbSchema = schemaOverride ?? await fs.readFile(path.resolve(__dirname, '../prompts/db-explorer-context.md'), 'utf8');
  return template.replace('{{dbSchema}}', dbSchema);
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
  const followUpWords = ['those', 'they', 'it ', 'these', 'that ', 'same', ' also', 'additionally', 'furthermore', 'what about', ' and '];
  if (followUpWords.some((w) => lower.includes(w))) return true;
  if (lower.split(/\s+/).length < 5) return true;
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
    const response = await client.chat.completions.create({
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
  async sendMessage(prompt, conversationId) {
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
        relevantTables = await selectRelevantTables(prompt, tableMetadata);
        console.log('[chat] pass 1 result:', relevantTables);
      }

      if (relevantTables && relevantTables.length > 0) {
        schemaContext = buildPartialSchemaContext(relevantTables, tableMetadata);
        if (!isCacheHit) {
          topicCache.set(conversationId, { query: prompt, tables: relevantTables });
        }
      } else {
        console.log('[chat] fallback → using full schema');
      }
    } else {
      console.log('[chat] no table-metadata.json → using full schema');
    }

    const instructions = await buildInstructions(schemaContext ?? undefined);
    const recentMessages = conversationRepository.getRecentMessages(conversationId, 10);
    const messages = [
      { role: 'system', content: instructions },
      ...recentMessages,
      { role: 'user', content: prompt },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      max_tokens: 200,
    });

    const assistantMessage = response.choices?.[0]?.message?.content ?? '';
    conversationRepository.appendMessage(conversationId, 'user', prompt);
    conversationRepository.appendMessage(conversationId, 'assistant', assistantMessage);

    return {
      id: response.id,
      message: assistantMessage,
    };
  },
};
