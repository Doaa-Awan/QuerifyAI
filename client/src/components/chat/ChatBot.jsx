import axios from 'axios';
import { useRef, useState } from 'react';
import TypingIndicator from './TypingIndicator';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatBot = ({ onTablesUsed, onFirstMessage }) => {
  const [messages, setMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [error, setError] = useState('');
  const conversationId = useRef(crypto.randomUUID());

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
      <div className='chat-header'>
        {/* <span></span> */}
        <span className='chat-hint'>AI answers in seconds</span>
      </div>
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
