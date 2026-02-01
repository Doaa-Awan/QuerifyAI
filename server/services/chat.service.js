// application logic

import { conversationRepository } from '../repositories/conversation.repository.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Implementation detail
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Public interface
export const chatService = {
  // Chat service methods would go here
  async sendMessage(prompt, conversationId) {
    // Implementation for sending a message
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 200, //max_completion_tokens
      previous_response: conversationRepository.getLastResponse(conversationId),
      //stream: true,
    });

    conversationRepository.setLastResponse(conversationId, response);

    return {
      id: response.id,
      message: response.choices[0].message.content,
    };
  },
};
