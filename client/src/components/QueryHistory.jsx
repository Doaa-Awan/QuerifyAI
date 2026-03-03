import { useState } from 'react';

const QueryHistory = ({ history }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  if (history.length === 0) return null;

  const handleCopy = async (id, sql) => {
    await navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExport = (e) => {
    e.stopPropagation();
    const content = history
      .map((item) => `-- ${item.prompt}\n${item.sql}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queries-${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='query-history-panel'>
      <div className='query-history-header' onClick={() => setIsOpen((prev) => !prev)}>
        <span className='query-history-title'>
          Query History
          <span style={{ fontWeight: 400, opacity: 0.7 }}>({history.length})</span>
        </span>
        <div className='query-history-actions' onClick={(e) => e.stopPropagation()}>
          {isOpen && (
            <button className='history-action-btn' onClick={handleExport} title='Download as .sql file'>
              Export .sql
            </button>
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', padding: '0 0.25rem' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className='query-history-list'>
          {history
            .slice()
            .reverse()
            .map((item) => (
              <div key={item.id} className='history-item'>
                <span className='history-prompt' title={item.prompt}>
                  {item.prompt}
                </span>
                <div className='history-item-actions'>
                  <button
                    className='history-item-btn'
                    onClick={() => handleCopy(item.id, item.sql)}
                  >
                    {copiedId === item.id ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default QueryHistory;
