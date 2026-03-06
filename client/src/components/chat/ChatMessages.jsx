import ReactMarkdown from 'react-markdown';
import { useEffect, useRef } from 'react';

const ChatMessages = ({ messages }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const area = containerRef.current?.closest('.chat-messages-area');
    if (area) {
      area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const onCopyMessage = (e) => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', selection);
    }
  };

  return (
    <div className='chat-messages' ref={containerRef}>
      {messages.map((message, index) => (
        <div
          key={index}
          onCopy={onCopyMessage}
          className={`chat-message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
