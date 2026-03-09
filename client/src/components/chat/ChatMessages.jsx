import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const CopyPre = ({ children, node, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const code = node?.children?.[0]?.children?.[0]?.value ?? '';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className='code-block-wrapper'>
      <button
        className={`copy-sql-btn${copied ? ' copied' : ''}`}
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy SQL'}
      >
        {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
};

const ChatMessages = ({ messages }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const area = containerRef.current?.closest('.chat-messages-area');
    if (area) {
      area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className='chat-messages' ref={containerRef}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`chat-message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
        >
          <ReactMarkdown components={{ pre: CopyPre }}>{message.content}</ReactMarkdown>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
