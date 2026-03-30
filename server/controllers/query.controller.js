// controller for the /api/query endpoint

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import z from 'zod';
import { chatService } from '../services/chat.service.js';
import { queryCache } from '../services/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tableMetadataPath = path.resolve(__dirname, '../prompts/table-metadata.json');

// Zod schema for incoming request body
const querySchema = z.object({
  question: z.string().trim().min(1, 'Question cannot be empty').max(1000, 'Question is too long (max 1000 characters)'),
  conversationId: z.string().uuid('conversationId must be a valid UUID'),
  dialect: z.string().trim().optional(),
});

/** Load table names from the metadata file; falls back to [] if missing. */
async function loadTableNames() {
  try {
    const content = await fs.readFile(tableMetadataPath, 'utf8');
    const metadata = JSON.parse(content);
    return Object.keys(metadata).filter((k) => !k.startsWith('_'));
  } catch {
    return [];
  }
}

// Public interface
export const queryController = {
  async handleQuery(req, res) {
    // Validate input
    const parseResult = querySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.format() });
      return;
    }

    const { question, conversationId, dialect } = parseResult.data;

    try {
      // Build cache key from question + dialect + current table names
      const tableNames = await loadTableNames();
      const cacheKey = queryCache.buildKey(`${dialect ?? ''}:${question}`, tableNames);

      // Cache hit — return immediately without calling AI
      const cached = queryCache.get(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }

      // Cache miss — call service
      const response = await chatService.sendMessage(question, conversationId, dialect);

      const result = {
        sql: response.sql ?? null,
        explanation: response.explanation,
        tablesUsed: response.tables_used ?? [],
        tablesCached: response.tables_cached ?? [],
        piiColumnsMasked: response.pii_columns_masked ?? [],
        tokenCount: response.token_count ?? 0,
      };

      queryCache.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate a response' });
    }
  },
};
