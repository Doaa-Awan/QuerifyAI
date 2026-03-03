import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import ResultsTable from '../ResultsTable';

const CopyPre = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef(null);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? '';
    await navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className='code-block-wrapper'>
      <button className='copy-code-btn' onClick={handleCopy} title='Copy to clipboard'>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
};

const markdownComponents = { pre: CopyPre };

const ChatMessages = ({ messages, queryResults = {}, onRunQuery }) => {
  const lastMessageRef = useRef(null);
  const [runningIndex, setRunningIndex] = useState(null);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, queryResults]);

  const handleRun = async (index, sql) => {
    setRunningIndex(index);
    await onRunQuery(index, sql);
    setRunningIndex(null);
  };

  const onCopyMessage = (e) => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', selection);
    }
  };

  return (
    <div className='chat-messages'>
      {messages.map((message, index) => (
        <div
          key={index}
          onCopy={onCopyMessage}
          ref={index === messages.length - 1 ? lastMessageRef : null}
          className={`chat-message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
        >
          <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>

          {message.role === 'bot' && message.sql && (
            <div className='run-query-row'>
              <button
                className='btn run-query-btn'
                onClick={() => handleRun(index, message.sql)}
                disabled={runningIndex === index}
              >
                {runningIndex === index ? 'Running…' : '▶ Run Query'}
              </button>
            </div>
          )}

          {message.role === 'bot' && queryResults[index] && (
            <ResultsTable result={queryResults[index]} />
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
