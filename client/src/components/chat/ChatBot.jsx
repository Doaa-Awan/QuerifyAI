import { useRef, useState } from 'react';
import TypingIndicator from './TypingIndicator';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import QueryHistory from '../QueryHistory';

// Empty string = relative URL, handled by Vite proxy in dev and nginx in production
const API_BASE = import.meta.env.VITE_API_URL || '';

const ChatBot = ({ onTablesUsed }) => {
  const [messages, setMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [error, setError] = useState('');
  const [queriesRemaining, setQueriesRemaining] = useState(null);
  const [queryResults, setQueryResults] = useState({});
  const [queryHistory, setQueryHistory] = useState([]);
  const conversationId = useRef(crypto.randomUUID());

  const onSubmit = async ({ prompt }) => {
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setIsBotTyping(true);
    setError('');

    // Insert a placeholder bot message for streaming
    setMessages((prev) => [...prev, { role: 'bot', content: '', sql: null }]);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, conversationId: conversationId.current }),
      });

      const remaining = response.headers.get('ratelimit-remaining');
      if (remaining !== null) setQueriesRemaining(parseInt(remaining, 10));

      if (response.status === 429) {
        const data = await response.json();
        setError(data.error || 'Query limit reached. Please try again later.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (!response.ok) {
        setError('Something went wrong. Please try again.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamingContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete chunk

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          let event;
          try {
            event = JSON.parse(part.slice(6));
          } catch {
            continue;
          }

          if (event.type === 'token') {
            streamingContent += event.content;
            setIsBotTyping(false);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'bot', content: streamingContent, sql: null };
              return updated;
            });
          } else if (event.type === 'done') {
            const { sql, explanation, tables_used } = event;
            const content = sql
              ? `${explanation}\n\n\`\`\`sql\n${sql}\n\`\`\``
              : explanation;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'bot', content, sql: sql || null };
              return updated;
            });
            if (typeof onTablesUsed === 'function' && tables_used?.length) {
              onTablesUsed(tables_used);
            }
            if (sql) {
              const historyItem = { id: crypto.randomUUID(), timestamp: new Date(), prompt, sql };
              setQueryHistory((prev) => [...prev, historyItem]);
            }
          } else if (event.type === 'error') {
            setError(event.error || 'Something went wrong.');
            setMessages((prev) => prev.slice(0, -1));
          }
        }
      }
    } catch (err) {
      console.error('Error submitting prompt:', err);
      setError('Something went wrong. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsBotTyping(false);
    }
  };

  const onRunQuery = async (messageIndex, sql) => {
    setQueryResults((prev) => ({ ...prev, [messageIndex]: { loading: true } }));
    try {
      const response = await fetch(`${API_BASE}/db/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      const data = await response.json();
      if (!response.ok) {
        setQueryResults((prev) => ({
          ...prev,
          [messageIndex]: { error: data.error || 'Execution failed.', loading: false },
        }));
      } else {
        setQueryResults((prev) => ({ ...prev, [messageIndex]: { ...data, loading: false } }));
      }
    } catch (err) {
      setQueryResults((prev) => ({
        ...prev,
        [messageIndex]: { error: 'Execution failed.', loading: false },
      }));
    }
  };

  return (
    <div className='chat-window'>
      <div className='chat-header'>
        <span className='chat-hint'>AI answers in seconds</span>
        {queriesRemaining !== null && (
          <span className='rate-limit-counter' title='Chat queries remaining today'>
            {queriesRemaining} / 20 left today
          </span>
        )}
      </div>
      <div>
        <div>
          <ChatMessages
            messages={messages}
            queryResults={queryResults}
            onRunQuery={onRunQuery}
          />
          {isBotTyping && <TypingIndicator />}
          {error && <p className='error-message'>{error}</p>}
        </div>
        <ChatInput onSubmit={onSubmit} />
      </div>
      <QueryHistory history={queryHistory} />
    </div>
  );
};

export default ChatBot;
