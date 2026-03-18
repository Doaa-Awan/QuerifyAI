//route definitions

import express from 'express';
import { chatController } from './controllers/chat.controller.js';
import { queryController } from './controllers/query.controller.js';
import { postgresController } from './controllers/postgres.controller.js';
import { mssqlController } from './controllers/mssql.controller.js';
import { chatLimiter, snapshotLimiter } from './middleware/rateLimiter.js';

const router = express.Router();

router.get('/api', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

router.post('/api/chat', chatLimiter, chatController.sendMessage);
router.post('/api/query', chatLimiter, queryController.handleQuery);

router.post('/db/connect-demo', postgresController.connectDemo);
router.post('/db/connect', postgresController.connect);
router.post('/api/connect', postgresController.connectAndIntrospect);
router.get('/db/status', postgresController.getStatus);
router.get('/health/db', postgresController.getHealth);
router.get('/db/schema', postgresController.getSchema);
router.get('/api/schema', postgresController.getIntrospectedSchema);
router.post('/db/explorer-context/snapshot', snapshotLimiter, postgresController.buildExplorerSnapshot);
router.post('/db/explorer-context/clear', postgresController.clearExplorerSnapshot);

router.post('/db/connect-sqlserver', mssqlController.connect);
router.get('/db/status-sqlserver', mssqlController.getStatus);
router.get('/health/db-sqlserver', mssqlController.getHealth);
router.get('/db/schema-sqlserver', mssqlController.getSchema);
router.post('/db/explorer-context-sqlserver/snapshot', snapshotLimiter, mssqlController.buildExplorerSnapshot);
router.post('/db/explorer-context-sqlserver/clear', mssqlController.clearExplorerSnapshot);

export default router;
