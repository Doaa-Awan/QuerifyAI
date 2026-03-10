// data access code
// Data repository for managing conversation message history

// conversationId -> [{ role: 'user' | 'assistant', content: string }]
const conversations = new Map();

const MAX_CONVERSATIONS = 200;
const MAX_MESSAGES_PER_CONVERSATION = 20;

// MEM-03 audit: All unbounded Maps are now capped.
// - topicCache (chat.service.js): capped at 100 entries (FIFO)
// - conversations (here): capped at 200 entries (FIFO) + 20 messages/conv
// - postgres.repository.js: uses a single dbState object, not a Map — no cap needed

function getHistory(conversationId) {
  if (!conversations.has(conversationId)) {
    if (conversations.size >= MAX_CONVERSATIONS) {
      conversations.delete(conversations.keys().next().value);
    }
    conversations.set(conversationId, []);
  }
  return conversations.get(conversationId);
}

export const conversationRepository = {
  getRecentMessages(conversationId, limit = 10) {
    const history = getHistory(conversationId);
    return history.slice(-limit);
  },
  appendMessage(conversationId, role, content) {
    const history = getHistory(conversationId);
    history.push({ role, content });
    if (history.length > MAX_MESSAGES_PER_CONVERSATION) {
      history.splice(0, history.length - MAX_MESSAGES_PER_CONVERSATION);
    }
  },
  // Test helpers — expose internal state for unit tests
  _getConversationsSize() {
    return conversations.size;
  },
  _getDepth(conversationId) {
    return conversations.has(conversationId) ? conversations.get(conversationId).length : 0;
  },
};
