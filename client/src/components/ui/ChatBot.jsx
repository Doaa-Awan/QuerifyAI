import axios from 'axios';
import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useForm } from 'react-hook-form';
import { FaArrowUp } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const conversationId = useRef(crypto.randomUUID());
  const { register, handleSubmit, reset, formState } = useForm();

  const onSubmit = async ({ prompt }) => {
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    reset();
    const { data } = await axios.post(`${API_BASE}/api/chat`, {
      prompt,
      conversationId: conversationId.current,
    });
    setMessages((prev) => [...prev, { role: 'bot', content: data.message }]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className='chat-window'>
      <div className='chat-header'>
        <span>New question</span>
        <span className='chat-hint'>AI answers in seconds</span>
      </div>
      {/* <div className='chat-messages'>
        <div className='chat-message muted'></div>
      </div> */}
      <div>
        <div className='chat-messages'>
          {messages.map((message, index) => (
            <p
              key={index}
              className={`chat-message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </p>
          ))}
        </div>
        <form
          className='chat-input'
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={onKeyDown}
        >
          <textarea
            {...register('prompt', {
              required: true,
              validate: (data) => data.trim().length > 0,
            })}
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
