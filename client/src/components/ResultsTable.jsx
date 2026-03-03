import { useState } from 'react';
import QueryChart from './QueryChart';

const ResultsTable = ({ result }) => {
  const [view, setView] = useState('table');

  if (result.loading) {
    return <div className='result-loading'>Running query…</div>;
  }

  if (result.error) {
    return <div className='result-error'>{result.error}</div>;
  }

  if (!result.rows || result.rows.length === 0) {
    return (
      <div className='result-empty'>
        Query returned 0 rows
        {result.executionTimeMs != null && ` · ${result.executionTimeMs}ms`}
      </div>
    );
  }

  const columns = result.columns?.length
    ? result.columns
    : Object.keys(result.rows[0]).map((name) => ({ name }));

  return (
    <div className='result-wrapper'>
      <div className='result-meta'>
        <span>
          {result.rowCount} row{result.rowCount !== 1 ? 's' : ''}
          {result.executionTimeMs != null && ` · ${result.executionTimeMs}ms`}
          {result.rows.length < result.rowCount && ` (showing first ${result.rows.length})`}
        </span>
        <div className='result-view-toggle'>
          <button
            className={`result-view-btn ${view === 'table' ? 'active' : ''}`}
            onClick={() => setView('table')}
          >
            Table
          </button>
          <button
            className={`result-view-btn ${view === 'chart' ? 'active' : ''}`}
            onClick={() => setView('chart')}
          >
            Chart
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className='result-scroll'>
          <table className='result-table'>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.name}>{col.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.name}>
                      {row[col.name] === null || row[col.name] === undefined ? (
                        <span className='result-null'>null</span>
                      ) : (
                        String(row[col.name])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <QueryChart columns={columns} rows={result.rows} />
      )}
    </div>
  );
};

export default ResultsTable;
