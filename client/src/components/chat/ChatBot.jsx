import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import TypingIndicator from './TypingIndicator';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const API_BASE = import.meta.env.VITE_API_URL || '';

const ChatBot = ({ onTablesUsed, onFirstMessage, dialect }) => {
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
      const { data } = await axios.post(`${API_BASE}/api/chat`, {
        prompt,
        conversationId: conversationId.current,
        dialect: dialect ?? 'sql',
      });
      const { sql, explanation, tables_used } = data;
      const content = sql
        ? `${explanation}\n\n\`\`\`sql\n${sql}\n\`\`\``
        : explanation;
      setMessages((prev) => [...prev, { role: 'bot', content }]);
      if (typeof onTablesUsed === 'function' && tables_used?.length) {
        onTablesUsed(tables_used);
      }
    } catch (err) {
      console.error('Error submitting prompt:', err);
      setError('Something went wrong. Please try again.');
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
          <ChatMessages messages={messages} />
          {isBotTyping && <TypingIndicator />}
          {error && <p className='error-message'>{error}</p>}
        </div>
        <ChatInput onSubmit={onSubmit} />
      </div>
    </div>
  );
};

export default ChatBot;
