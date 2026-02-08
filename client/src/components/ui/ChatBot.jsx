import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useForm } from 'react-hook-form';
import { FaArrowUp } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [error, setError] = useState('');
  const lastMessageRef = useRef(null);
  const conversationId = useRef(crypto.randomUUID());
  const { register, handleSubmit, reset, formState } = useForm();

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSubmit = async ({ prompt }) => {
    try {
      setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
      setIsBotTyping(true);
      setError('');
      reset({ prompt: '' });
      const { data } = await axios.post(`${API_BASE}/api/chat`, {
        prompt,
        conversationId: conversationId.current,
      });
      setMessages((prev) => [...prev, { role: 'bot', content: data.message }]);
    } catch (err) {
      console.error('Error submitting prompt:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsBotTyping(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const onCopyMessage = (e) => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', selection);
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
      <div>
        <div className='chat-messages'>
          {messages.map((message, index) => (
            <div
              key={index}
              onCopy={onCopyMessage}
              ref={index === messages.length - 1 ? lastMessageRef : null}
              className={`chat-message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ))}
          {isBotTyping && (
            <div className='bot-typing'>
              <div className='bot-typing-dot'></div>
              <div
                className='bot-typing-dot'
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className='bot-typing-dot'
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          )}
          {error && <p className='error-message'>{error}</p>}
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={onKeyDown}
          className='chat-input'
        >
          <textarea
            {...register('prompt', {
              required: true,
              validate: (data) => data.trim().length > 0,
            })}
            autoFocus
            placeholder='Ask something like “Show total revenue by month” or “List top 10 customers.”'
            aria-label='Ask a question about your database'
            maxLength={1000}
          />
          <button
            disabled={!formState.isValid}
            className='btn primary'
            type='submit'
          >
            <FaArrowUp />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
