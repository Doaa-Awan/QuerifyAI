import { useState, useRef, useEffect } from 'react';
import { HiOutlineTableCells, HiChevronDown } from 'react-icons/hi2';

function columnTooltipKey(tableName, columnName) {
  return `${tableName}\0${columnName}`;
}

export default function SchemaSidebar({ tables = [], highlightedTables = new Set() }) {
  const [expandedTables, setExpandedTables] = useState({});
  const [columnTooltip, setColumnTooltip] = useState(null);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const tooltipCloseRef = useRef(null);

  const tooltipKey = columnTooltip
    ? columnTooltipKey(columnTooltip.tableName, columnTooltip.columnName)
    : null;

  const toggleTable = (event, tableName) => {
    event.stopPropagation();
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

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
    const currentKey = columnTooltip
      ? columnTooltipKey(columnTooltip.tableName, columnTooltip.columnName)
      : null;
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
    <aside className="db-sidebar" aria-label="Schema tables">
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
                    className={`table-row ${expandedTables[table.name] ? 'expanded' : ''} ${highlightedTables.has(table.name) ? 'highlighted' : ''}`}
                    type="button"
                    onClick={(e) => toggleTable(e, table.name)}
                  >
                    <HiChevronDown className="table-row-chevron" aria-hidden />
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
  );
}
