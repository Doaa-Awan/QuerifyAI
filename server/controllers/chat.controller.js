//gateway
// controller for chat-related endpoints

import { chatService } from '../services/chat.service';
import z from 'zod';

// Implementation detail
const chatSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt cannot be empty').max(1000, 'Prompt is too long (max 1000 characters)'),
  conversationId: z.string().uuid(),
});

// Public interface
export const chatController = {
  async sendMessage(req, res) {
    //validate input
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.format() });
      return;
    }

    try {
      const { prompt, conversationId } = req.body;
      const response = await chatService.sendMessage(prompt, conversationId);
      res.json({ message: response.message });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate a response' });
    }
  },
};
