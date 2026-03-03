//gateway
// controller for chat-related endpoints

import { chatService } from '../services/chat.service.js';
import z from 'zod';

const chatSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt cannot be empty').max(1000, 'Prompt is too long (max 1000 characters)'),
  conversationId: z.string().uuid(),
});

// Public interface
export const chatController = {
  async sendMessage(req, res) {
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.format() });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { prompt, conversationId } = parseResult.data;

    try {
      const result = await chatService.sendMessage(prompt, conversationId);

      // Stream the explanation token-by-token for real-time feel
      const tokens = result.explanation.split(/(?<=\s+)|(?=\s+)/);
      for (const token of tokens) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      }

      // Send the complete structured result
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          sql: result.sql,
          explanation: result.explanation,
          tables_used: result.tables_used,
        })}\n\n`
      );
    } catch (error) {
      console.error('[chat] error:', error.message);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate a response' })}\n\n`);
    } finally {
      res.end();
    }
  },
};
