// application logic

import { conversationRepository } from '../repositories/conversation.repository';
import OpenAI from 'openai';

// Implementation detail
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// type ChatResponse = {
//     id: String;
//     message: String;
// }

// Public interface
export const chatService = {
  // Chat service methods would go here
  async sendMessage(prompt, conversationId) {
    // Implementation for sending a message
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 100, //max_completion_tokens
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
