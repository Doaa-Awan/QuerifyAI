import { useState } from 'react';

const DIALECT_LABEL = { postgres: 'PostgreSQL', sqlserver: 'SQL Server' };
import ChatBot from './components/chat/ChatBot';
import SchemaSidebar from './components/SchemaSidebar';
import SchemaVisualizer from './components/SchemaVisualizer';
import RateLimitBanner from './components/RateLimitBanner.jsx';
import { HiOutlineCircleStack, HiOutlineTableCells } from 'react-icons/hi2';

function RateLimitBadge({ remaining, limit, reset }) {
  if (remaining == null || limit == null) return null;
  const hoursLeft = reset ? Math.ceil(reset / 3600) : null;
  let mod = '';
  if (remaining <= 0) mod = ' rate-limit-badge--danger';
  else if (remaining / limit <= 0.5) mod = remaining <= 5 ? ' rate-limit-badge--danger' : ' rate-limit-badge--warn';
  return (
    <span className={`rate-limit-badge${mod}`} aria-live="polite">
      {remaining <= 0
        ? `Limit reached${hoursLeft ? ` — resets in ${hoursLeft}h` : ''}`
        : `${remaining} / ${limit} queries left today`}
    </span>
  );
}

export default function DbExplorer({ tables = [], onBack, onExit, dialect = 'postgres' }) {
  const dialectLabel = DIALECT_LABEL[dialect] ?? 'PostgreSQL';
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('querify_ratelimit');
      return saved ? JSON.parse(saved) : { remaining: null, limit: null, reset: null };
    } catch { return { remaining: null, limit: null, reset: null }; }
  });
  const isBlocked = rateLimitInfo.remaining != null && rateLimitInfo.remaining <= 0;
  const [hasMessages, setHasMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('querify_messages');
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch {
      return false;
    }
  });
  const [highlightedTables, setHighlightedTables] = useState(new Set());
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleBack = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    if (typeof onExit === 'function') void onExit();
    if (typeof onBack === 'function') onBack();
  };

  const handleTablesUsed = (tables) => setHighlightedTables(new Set(tables));

  if (showVisualizer) {
    return <SchemaVisualizer tables={tables} onBack={() => setShowVisualizer(false)} />;
  }

  return (
    <div className={`db-explorer-shell${hasMessages ? ' has-messages' : ''}`}>
      {showExitConfirm && (
        <div className="exit-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="exit-confirm-title">
          <div className="exit-confirm-modal">
            <h3 id="exit-confirm-title">Exit session?</h3>
            <p>You will lose your current chat history and query state. This cannot be undone.</p>
            <div className="exit-confirm-actions">
              <button className="btn ghost" type="button" onClick={() => setShowExitConfirm(false)}>
                Cancel
              </button>
              <button className="btn danger" type="button" onClick={handleConfirmExit}>
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}
      <nav className={`db-explorer-nav${hasMessages ? ' db-explorer-nav--floating' : ''}`} aria-label="Explorer actions">
        <button
          className="btn ghost btn-nav btn-back"
          type="button"
          onClick={handleBack}
        >
          Exit
        </button>
        <button
          className="btn ghost btn-nav"
          type="button"
          onClick={() => setShowVisualizer(true)}
          title="View schema visualizer"
        >
          <HiOutlineCircleStack aria-hidden />
          <span>View Schema</span>
        </button>
        <button
          className="btn ghost btn-nav btn-schema-toggle"
          type="button"
          onClick={() => setSidebarOpen(v => !v)}
          aria-expanded={sidebarOpen}
          aria-label="Toggle schema sidebar"
        >
          <HiOutlineTableCells aria-hidden />
          <span>Tables</span>
        </button>
        <RateLimitBadge remaining={rateLimitInfo.remaining} limit={rateLimitInfo.limit} reset={rateLimitInfo.reset} />
      </nav>

      <div className="dialect-control">
        <span className="dialect-label">Dialect</span>
        <span className="dialect-option active">{dialectLabel}</span>
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

      <div className="db-explorer-body">
        <section className="db-main">
          <RateLimitBanner remaining={rateLimitInfo.remaining} />
          <ChatBot onTablesUsed={handleTablesUsed} onFirstMessage={() => setHasMessages(true)} dialect={dialect} onRateLimitUpdate={setRateLimitInfo} isBlocked={isBlocked} />
        </section>

        <SchemaSidebar tables={tables} highlightedTables={highlightedTables} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}
