import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import { ssmsTheme } from './ssmsTheme';

SyntaxHighlighter.registerLanguage('sql', sql);

const SQL_START = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|MERGE|TRUNCATE|EXEC|EXECUTE|DECLARE|BEGIN|COMMIT|ROLLBACK)\b/i;

function isSqlBlock(codeText, langClass) {
  if (langClass?.includes('language-sql')) return true;
  if (!langClass && SQL_START.test(codeText)) return true;
  return false;
}

const CopyPre = ({ children, node, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const code = node?.children?.[0]?.children?.[0]?.value ?? '';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const codeChild = node?.children?.[0];
  const langClass = codeChild?.properties?.className?.join(' ') ?? '';
  const codeText = codeChild?.children?.[0]?.value ?? '';
  const showHighlight = isSqlBlock(codeText, langClass);

  return (
    <div className='code-block-wrapper'>
      <button
        className={`copy-sql-btn${copied ? ' copied' : ''}`}
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy SQL'}
      >
        {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
      </button>
      <pre {...props}>
        {showHighlight ? (
          <SyntaxHighlighter
            language="sql"
            style={ssmsTheme}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: 'inherit',
              fontFamily: 'inherit',
            }}
            codeTagProps={{ style: { background: 'transparent' } }}
          >
            {codeText}
          </SyntaxHighlighter>
        ) : (
          children
        )}
      </pre>
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
