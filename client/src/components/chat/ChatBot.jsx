import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import TypingIndicator from './TypingIndicator';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const API_BASE = import.meta.env.VITE_API_URL || '';

const ChatBot = ({ onTablesUsed, onFirstMessage, dialect, onRateLimitUpdate }) => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('querify_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [error, setError] = useState('');
  const conversationId = useRef(
    localStorage.getItem('querify_conversation_id') ?? (() => {
      const id = crypto.randomUUID();
      localStorage.setItem('querify_conversation_id', id);
      return id;
    })()
  );

  useEffect(() => {
    localStorage.setItem('querify_messages', JSON.stringify(messages));
  }, [messages]);

  const onSubmit = async ({ prompt }) => {
    try {
      if (messages.length === 0 && typeof onFirstMessage === 'function') {
        onFirstMessage();
      }
      setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
      setIsBotTyping(true);
      setError('');
      //api call to backend with prompt and conversationId
      const response = await axios.post(`${API_BASE}/api/query`, {
        question: prompt,
        conversationId: conversationId.current,
        dialect,
      });
      const { sql, explanation, tablesUsed } = response.data;
      const rlRemaining = response.headers['ratelimit-remaining'];
      const rlLimit = response.headers['ratelimit-limit'];
      const rlReset = response.headers['ratelimit-reset'];
      if (rlRemaining != null && rlLimit != null) {
        const info = { remaining: Number(rlRemaining), limit: Number(rlLimit), reset: rlReset ? Number(rlReset) : null };
        localStorage.setItem('querify_ratelimit', JSON.stringify(info));
        if (typeof onRateLimitUpdate === 'function') onRateLimitUpdate(info);
      }
      const content = sql
        ? `${explanation}\n\n\`\`\`sql\n${sql}\n\`\`\``
        : explanation;
      setMessages((prev) => [...prev, { role: 'bot', content }]);
      if (typeof onTablesUsed === 'function' && tablesUsed?.length) {
        onTablesUsed(tablesUsed);
      }
    } catch (err) {
      console.error('Error submitting prompt:', err);
      if (err.response?.status === 429) {
        const rlRemaining = err.response.headers['ratelimit-remaining'];
        const rlLimit = err.response.headers['ratelimit-limit'];
        const rlReset = err.response.headers['ratelimit-reset'];
        if (rlRemaining != null && rlLimit != null) {
          const info = { remaining: Number(rlRemaining), limit: Number(rlLimit), reset: rlReset ? Number(rlReset) : null };
          localStorage.setItem('querify_ratelimit', JSON.stringify(info));
          if (typeof onRateLimitUpdate === 'function') onRateLimitUpdate(info);
        }
        setError(err.response.data?.error || 'Daily query limit reached. Please try again tomorrow.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className='chat-window'>
      {messages.length === 0 && (
        <div className='chat-header'>
          <span className='chat-hint'>AI answers in seconds</span>
        </div>
      )}
      {/* <div className='chat-messages'>
        <div className='chat-message muted'></div>
      </div> */}
      <div className='chat-body'>
        <div className='chat-messages-area'>
          <ChatMessages messages={messages} error={error} />
          {isBotTyping && <TypingIndicator />}
        </div>
        <ChatInput onSubmit={onSubmit} />
      </div>
    </div>
  );
};

export default ChatBot;
