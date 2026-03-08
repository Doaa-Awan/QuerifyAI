// gateway
// controller for postgres-related endpoints

import { postgresService } from '../services/postgres.service.js';
import { schemaStore } from '../services/schemaStore.js';
import z from 'zod';

const connectSchema = z
  .object({
    host: z.string().trim().min(1, 'Host is required'),
    user: z.string().trim().min(1, 'User is required'),
    database: z.string().trim().min(1, 'Database is required'),
  })
  .passthrough();

// Public interface
export const postgresController = {
  async connectDemo(req, res) {
    const result = await postgresService.connectDemo();
    if (result.ok) {
      res.json({ message: 'Connected to demo DB' });
      return;
    }

    res.status(result.status || 500).json({
      error: result.error || 'Failed to connect to demo DB',
    });
  },
  async connect(req, res) {
    const parseResult = connectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.format() });
      return;
    }

    const result = await postgresService.connect(parseResult.data);
    if (result.ok) {
      res.json({ message: 'Connected' });
      return;
    }

    res.status(result.status || 500).json({
      error: result.error || 'Failed to connect with provided credentials',
    });
  },
  getStatus(req, res) {
    res.json(postgresService.getStatus());
  },
  async getHealth(req, res) {
    const result = await postgresService.getHealth();
    if (result.ok) {
      res.json(result.body);
      return;
    }

    res.status(result.status || 500).json(result.body);
  },
  async getSchema(req, res) {
    const result = await postgresService.getSchema();
    if (result.ok) {
      res.json(result.body);
      return;
    }

    res.status(result.status || 500).json(result.body);
  },
  async buildExplorerSnapshot(req, res) {
    const result = await postgresService.buildExplorerSnapshot();
    if (result.ok) {
      res.json(result.body);
      return;
    }

    res.status(result.status || 500).json(result.body);
  },
  async clearExplorerSnapshot(req, res) {
    const result = await postgresService.clearExplorerSnapshot();
    if (result.ok) {
      res.json(result.body);
      return;
    }

    res.status(result.status || 500).json(result.body);
  },
  getIntrospectedSchema(req, res) {
    if (!schemaStore.isAvailable()) {
      res.status(503).json({ error: 'No schema available. Connect to a database first.' });
      return;
    }

    const { tables } = schemaStore.get();

    const relationships = tables.flatMap((table) =>
      table.foreignKeys.map((fk) => ({
        fromTable: table.name,
        fromColumn: fk.column,
        toTable: fk.referencedTable,
        toColumn: fk.referencedColumn,
      }))
    );

    res.json({ tables, relationships });
  },
  async connectAndIntrospect(req, res) {
    const parseResult = connectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.format() });
      return;
    }

    const result = await postgresService.connectAndIntrospect(parseResult.data);
    if (result.ok) {
      req.session.connected = true;
      res.json({ tables: result.tables, descriptions: result.descriptions });
      return;
    }

    res.status(result.status || 500).json({
      error: result.error || 'Failed to connect',
    });
  },
};
