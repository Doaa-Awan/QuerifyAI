import { useState, useRef, useEffect } from 'react';
import ChatBot from './components/chat/ChatBot';
import ERDModal from './components/ERDModal';
import { HiOutlineSquares2X2, HiOutlineTableCells, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

function columnTooltipKey(tableName, columnName) {
  return `${tableName}\0${columnName}`;
}

export default function DbExplorer({ tables = [], onBack, onExit }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedTables, setExpandedTables] = useState({});
  const [erdOpen, setErdOpen] = useState(false);
  const [columnTooltip, setColumnTooltip] = useState(null);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const tooltipCloseRef = useRef(null);

  const handleBack = () => {
    if (typeof onExit === 'function') {
      void onExit();
    }
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  const toggleTable = (event, tableName) => {
    event.stopPropagation();
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const tooltipKey = columnTooltip
    ? columnTooltipKey(columnTooltip.tableName, columnTooltip.columnName)
    : null;

  const showTooltip = (tableName, column) => {
    setColumnTooltip({
      tableName,
      columnName: column.name,
      dataType: column.dataType,
    });
  };

  const hideTooltip = () => {
    if (!tooltipPinned) setColumnTooltip(null);
  };

  const toggleTooltipPin = (tableName, column) => {
    const key = columnTooltipKey(tableName, column.name);
    const currentKey = columnTooltip ? columnTooltipKey(columnTooltip.tableName, columnTooltip.columnName) : null;
    if (currentKey === key) {
      setTooltipPinned(false);
      setColumnTooltip(null);
    } else {
      setColumnTooltip({ tableName, columnName: column.name, dataType: column.dataType });
      setTooltipPinned(true);
    }
  };

  useEffect(() => {
    if (!tooltipPinned) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setTooltipPinned(false);
        setColumnTooltip(null);
      }
    };
    const handleClickOutside = (e) => {
      if (tooltipCloseRef.current && !tooltipCloseRef.current.contains(e.target)) {
        setTooltipPinned(false);
        setColumnTooltip(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('click', handleClickOutside, true);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('click', handleClickOutside, true);
    };
  }, [tooltipPinned]);

  return (
    <div className="db-explorer-shell">
      <header className="db-explorer-header">
        <div className="db-explorer-branding">
          <p className="eyebrow">AI DB Explorer</p>
          <h2>Ask the database</h2>
          <p className="subtitle">Use plain language to explore tables, rows, and relationships.</p>
        </div>
        <nav className="db-explorer-nav" aria-label="Explorer actions">
          <button
            className="btn ghost btn-nav erd-trigger"
            type="button"
            onClick={() => setErdOpen(true)}
            title="View entity relationship diagram"
          >
            <HiOutlineSquares2X2 aria-hidden />
            <span>View ERD</span>
          </button>
          <button
            className="btn ghost btn-nav btn-back"
            type="button"
            onClick={handleBack}
          >
            Back
          </button>
        </nav>
      </header>

      {erdOpen && (
        <ERDModal tables={tables} onClose={() => setErdOpen(false)} />
      )}

      <div className={`db-explorer-body ${isCollapsed ? 'collapsed' : ''}`}>
        <section className="db-main">
          <ChatBot />
        </section>

        <aside
          className={`db-sidebar ${isCollapsed ? 'collapsed' : ''}`}
          aria-label="Schema tables"
        >
          <button
            className="sidebar-toggle"
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand schema panel' : 'Collapse schema panel'}
          >
            {isCollapsed ? (
              <HiChevronLeft aria-hidden />
            ) : (
              <HiChevronRight aria-hidden />
            )}
          </button>
          <div className="sidebar-inner">
            <div className="sidebar-header">
              <HiOutlineTableCells className="sidebar-icon" aria-hidden />
              <span className="sidebar-title">Schema</span>
              <span className="sidebar-count" aria-label={`${tables.length} tables`}>
                {tables.length}
              </span>
            </div>
            <div className="table-list">
              {tables.length === 0 ? (
                <p className="empty-state">No tables found.</p>
              ) : (
                <ul>
                  {tables.map((table) => (
                    <li key={table.name} className="table-item">
                      <button
                        className={`table-row ${expandedTables[table.name] ? 'expanded' : ''}`}
                        type="button"
                        onClick={(e) => toggleTable(e, table.name)}
                      >
                        <span className="table-name">{table.name}</span>
                        <span className="count">{table.columnCount}</span>
                      </button>
                      {expandedTables[table.name] && table.columns?.length ? (
                        <ul className="column-list" ref={tooltipPinned ? tooltipCloseRef : null}>
                          {table.columns.map((column) => {
                            const key = columnTooltipKey(table.name, column.name);
                            const isActive = tooltipKey === key;
                            return (
                              <li
                                key={`${table.name}.${column.name}`}
                                className="column-row"
                                onMouseEnter={() => showTooltip(table.name, column)}
                                onMouseLeave={hideTooltip}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTooltipPin(table.name, column);
                                }}
                              >
                                <span className="column-name">{column.name}</span>
                                <span className="column-meta">
                                  {column.isPrimary && <span className="key-badge pk">PK</span>}
                                  {column.isForeign && (
                                    <span className="key-badge fk">
                                      FK{column.foreignTable ? ` → ${column.foreignTable}` : ''}
                                    </span>
                                  )}
                                </span>
                                {isActive && (
                                  <span className="column-type-tooltip" role="tooltip">
                                    {columnTooltip.dataType}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
