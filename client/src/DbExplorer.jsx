import { useState } from 'react';
import ChatBot from './components/chat/ChatBot';
import ERDModal from './components/ERDModal';
import SchemaSidebar from './components/SchemaSidebar';
import { HiOutlineSquares2X2 } from 'react-icons/hi2';

export default function DbExplorer({ tables = [], onBack, onExit }) {
  const [dialect, setDialect] = useState('sql');
  const [hasMessages, setHasMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('querify_messages');
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch {
      return false;
    }
  });
  const [highlightedTables, setHighlightedTables] = useState(new Set());
  const [erdOpen, setErdOpen] = useState(false);

  const handleBack = () => {
    if (typeof onExit === 'function') {
      void onExit();
    }
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  const handleTablesUsed = (tables) => setHighlightedTables(new Set(tables));

  return (
    <div className={`db-explorer-shell${hasMessages ? ' has-messages' : ''}`}>
      <nav className={`db-explorer-nav${hasMessages ? ' db-explorer-nav--floating' : ''}`} aria-label="Explorer actions">
        <button
          className="btn ghost btn-nav btn-back"
          type="button"
          onClick={handleBack}
        >
          Back
        </button>
        <button
          className="btn ghost btn-nav erd-trigger"
          type="button"
          onClick={() => setErdOpen(true)}
          title="View entity relationship diagram"
        >
          <HiOutlineSquares2X2 aria-hidden />
          <span>View ERD</span>
        </button>
      </nav>

      <div className="dialect-control">
        <span className="dialect-label">Output format</span>
        <div className="dialect-picker" role="group" aria-label="Query output format">
          <button
            className={`dialect-option${dialect === 'sql' ? ' active' : ''}`}
            type="button"
            onClick={() => setDialect('sql')}
          >
            SQL
          </button>
          <button
            className="dialect-option"
            type="button"
            disabled
            title="PostgreSQL support coming soon"
          >
            PostgreSQL <span className="dialect-soon">Soon</span>
          </button>
        </div>
      </div>

      {!hasMessages && (
        <header className="db-explorer-header">
          <div className="db-explorer-branding">
            <p className="eyebrow">AI DB Explorer</p>
            <h2>QuerifyAI</h2>
            <p className="subtitle">Built for developers and analysts navigating databases they did not build.</p>
          </div>
        </header>
      )}

      {erdOpen && (
        <ERDModal tables={tables} onClose={() => setErdOpen(false)} />
      )}

      <div className="db-explorer-body">
        <section className="db-main">
          <ChatBot onTablesUsed={handleTablesUsed} onFirstMessage={() => setHasMessages(true)} dialect={dialect} />
        </section>

        <SchemaSidebar tables={tables} highlightedTables={highlightedTables} />
      </div>
    </div>
  );
}
