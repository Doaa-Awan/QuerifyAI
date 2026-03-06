//route definitions

import express from 'express';
import { chatController } from './controllers/chat.controller.js';
import { postgresController } from './controllers/postgres.controller.js';
import { chatLimiter, snapshotLimiter } from './middleware/rateLimiter.js';

const router = express.Router();

router.get('/api', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

router.post('/api/chat', chatLimiter, chatController.sendMessage);

router.post('/db/connect-demo', postgresController.connectDemo);
router.post('/db/connect', postgresController.connect);
router.get('/db/status', postgresController.getStatus);
router.get('/health/db', postgresController.getHealth);
router.get('/db/schema', postgresController.getSchema);
router.post('/db/explorer-context/snapshot', snapshotLimiter, postgresController.buildExplorerSnapshot);
router.post('/db/explorer-context/clear', postgresController.clearExplorerSnapshot);

export default router;
