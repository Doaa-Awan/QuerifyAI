// gateway
// Controller for SQL Server endpoints

import { mssqlService } from '../services/mssql.service.js';
import z from 'zod';

const connectSchema = z.object({
  server: z.string().trim().min(1, 'Server is required'),
  user: z.string().trim().min(1, 'User is required'),
  database: z.string().trim().min(1, 'Database is required'),
  port: z.union([z.string(), z.number()]).optional(),
  password: z.string().optional(),
  instanceName: z.string().optional(),
  trustServerCertificate: z.boolean().optional(),
  encrypt: z.boolean().optional(),
});

// Public interface
export const mssqlController = {
  async connectDemo(req, res) {
    const result = await mssqlService.connectDemo();
    if (result.ok) {
      req.session.connected = true;
      res.json({ message: 'Connected to demo SQL Server' });
      return;
    }
    req.session.connected = false;
    res.status(result.status || 500).json({
      error: result.error || 'Failed to connect to demo SQL Server',
    });
  },

  async connect(req, res) {
    const parseResult = connectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.format() });
      return;
    }

    const result = await mssqlService.connect(parseResult.data);
    if (result.ok) {
      req.session.connected = true;
      res.json({ message: 'Connected to SQL Server' });
      return;
    }

    req.session.connected = false;
    res.status(result.status || 500).json({
      error: result.error || 'Failed to connect to SQL Server',
    });
  },

  getStatus(req, res) {
    res.json(mssqlService.getStatus());
  },

  async getHealth(req, res) {
    const result = await mssqlService.getHealth();
    if (result.ok) {
      res.json(result.body);
      return;
    }
    res.status(result.status || 500).json(result.body);
  },

  async getSchema(req, res) {
    const result = await mssqlService.getSchema();
    if (result.ok) {
      res.json(result.body);
      return;
    }
    res.status(result.status || 500).json(result.body);
  },

  async buildExplorerSnapshot(req, res) {
    const result = await mssqlService.buildExplorerSnapshot();
    if (result.ok) {
      res.json(result.body);
      return;
    }
    res.status(result.status || 500).json(result.body);
  },

  async clearExplorerSnapshot(req, res) {
    const result = await mssqlService.clearExplorerSnapshot();
    if (result.ok) {
      res.json(result.body);
      return;
    }
    res.status(result.status || 500).json(result.body);
  },
};
