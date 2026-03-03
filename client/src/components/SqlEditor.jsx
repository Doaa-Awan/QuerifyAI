import { useState, useEffect } from 'react';
import ResultsTable from './ResultsTable';

const API_BASE = import.meta.env.VITE_API_URL || '';

const SqlEditor = ({ initialSql }) => {
  const [sql, setSql] = useState(initialSql || '');
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  // When new SQL arrives from AI, populate the editor
  useEffect(() => {
    if (initialSql) setSql(initialSql);
  }, [initialSql]);

  const handleRun = async () => {
    if (!sql.trim()) return;
    setIsRunning(true);
    setResult(null);
    try {
      const response = await fetch(`${API_BASE}/db/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult({ error: data.error || 'Execution failed.' });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ error: 'Execution failed.' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
    // Tab inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const next = sql.slice(0, selectionStart) + '  ' + sql.slice(selectionEnd);
      setSql(next);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      });
    }
  };

  return (
    <div className='sql-editor-panel'>
      <div className='sql-editor-header'>
        <span className='sql-editor-title'>SQL Editor</span>
        <span className='sql-editor-hint'>Ctrl+Enter to run</span>
        <div className='sql-editor-actions'>
          <button className='sql-editor-btn' onClick={handleCopy} disabled={!sql.trim()}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className='sql-editor-btn run'
            onClick={handleRun}
            disabled={isRunning || !sql.trim()}
          >
            {isRunning ? 'Running…' : '▶ Run'}
          </button>
        </div>
      </div>

      <textarea
        className='sql-editor-textarea'
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='SELECT * FROM ...'
        spellCheck={false}
        autoComplete='off'
        autoCorrect='off'
      />

      <div className='sql-editor-results'>
        {result ? (
          <ResultsTable result={result} />
        ) : (
          <p className='sql-editor-placeholder'>Results will appear here after running a query.</p>
        )}
      </div>
    </div>
  );
};

export default SqlEditor;
