//route definitions

import express from 'express';
import { chatController } from '../controllers/chat.controller.js';

const router = express.Router();

router.get('/api', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

router.post('/api/chat', chatController.sendMessage);

export default router;