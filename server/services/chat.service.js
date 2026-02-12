// application logic

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { conversationRepository } from '../repositories/conversation.repository.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Implementation detail
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function buildInstructions() {
  const template = await fs.readFile(path.resolve(__dirname, '../prompts/chatbot.txt'), 'utf8');
  const dbSchema = await fs.readFile(path.resolve(__dirname, '../prompts/db-explorer-context.md'), 'utf8');
  return template.replace('{{dbSchema}}', dbSchema);
}

// Public interface
export const chatService = {
  // Chat service methods would go here
  async sendMessage(prompt, conversationId) {
    const instructions = await buildInstructions();

    // Implementation for sending a message
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      // instructions,
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: prompt },
      ],
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
