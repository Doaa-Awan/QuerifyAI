import { useState, useEffect } from 'react';
import axios from 'axios';
import postgresLogo from '/icons8-postgres.svg';
import sqlserverLogo from '/icons8-microsoft-sql-server.svg';
import DbExplorer from '../DbExplorer.jsx';
import { API_BASE } from '../api.js';
import ColdStartBanner from './ColdStartBanner.jsx';

export default function Login() {
  const [_data, setData] = useState({ message: 'Loading...' });
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [dbStatus, setDbStatus] = useState('unknown');
  const [showExplorer, setShowExplorer] = useState(() => localStorage.getItem('querify_connected') === 'true');
  const [schema, setSchema] = useState(() => {
    try {
      const saved = localStorage.getItem('querify_schema');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeDb, setActiveDb] = useState('postgres');
  const [loading, setLoading] = useState(false);

  // SQL Server connection fields
  const [sqlServer, setSqlServer] = useState('');
  const [sqlPort, setSqlPort] = useState('1433');
  const [sqlUser, setSqlUser] = useState('');
  const [sqlPassword, setSqlPassword] = useState('');
  const [sqlDatabase, setSqlDatabase] = useState('');
  const [sqlInstance, setSqlInstance] = useState('');

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData({ message: 'Server unavailable' });
    }
  };

  const checkDbStatus = async (dbType = 'postgres') => {
    const endpoint = dbType === 'sqlserver' ? '/db/status-sqlserver' : '/db/status';
    try {
      const res = await axios.get(`${API_BASE}${endpoint}`);
      const available = !!res.data.available;
      setDbStatus(available ? 'available' : 'unavailable');
      return available;
    } catch {
      setDbStatus('unavailable');
      return false;
    }
  };

  const fetchSchema = async (dbType = 'postgres') => {
    const endpoint = dbType === 'sqlserver' ? '/db/schema-sqlserver' : '/db/schema';
    try {
      const res = await axios.get(`${API_BASE}${endpoint}`);
      const rows = Array.isArray(res.data) ? res.data : [];
      const tableMap = rows.reduce((acc, row) => {
        const name = typeof row === 'string' ? row : row.table_name;
        if (!name) return acc;
        if (!acc[name]) {
          acc[name] = { name, columns: [] };
        }
        if (row.column_name) {
          acc[name].columns.push({
            name: row.column_name,
            dataType: row.data_type || 'unknown',
            isPrimary: !!row.is_primary,
            isForeign: !!row.is_foreign,
            foreignTable: row.foreign_table || null,
            foreignColumn: row.foreign_column || null,
          });
        }
        return acc;
      }, {});

      const tables = Object.values(tableMap)
        .map((table) => ({
          ...table,
          columnCount: table.columns.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setSchema(tables);
      localStorage.setItem('querify_schema', JSON.stringify(tables));
      return tables;
    } catch (err) {
      console.error('Failed to fetch schema', err);
      setStatusMessage('Failed to load schema');
      return [];
    }
  };

  const mergeDescriptions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/table-descriptions`);
      const descMap = res.data;
      if (!descMap || !Object.keys(descMap).length) return;
      setSchema((prev) => {
        const updated = prev.map((t) => ({ ...t, description: descMap[t.name] ?? '' }));
        localStorage.setItem('querify_schema', JSON.stringify(updated));
        return updated;
      });
    } catch {
      // non-fatal
    }
  };

  const generateExplorerContext = async (dbType = 'postgres') => {
    const endpoint = dbType === 'sqlserver' ? '/db/explorer-context-sqlserver/snapshot' : '/db/explorer-context/snapshot';
    try {
      await axios.post(`${API_BASE}${endpoint}`);
    } catch (err) {
      console.error('Failed to generate DB explorer context', err);
      throw err;
    }
  };

  const clearExplorerContext = async (dbType = 'postgres') => {
    const endpoint = dbType === 'sqlserver' ? '/db/explorer-context-sqlserver/clear' : '/db/explorer-context/clear';
    try {
      await axios.post(`${API_BASE}${endpoint}`);
    } catch (err) {
      console.error('Failed to clear DB explorer context', err);
    }
  };

  const connect = async () => {
    setLoading(true);
    setStatusMessage('Connecting...');
    try {
      const res = await axios.post(`${API_BASE}/db/connect`, { host, port, user, password, database });
      setStatusMessage(res.data.message || 'Connected');
      const available = await checkDbStatus('postgres');
      if (available) {
        await fetchSchema('postgres');
        try {
          await generateExplorerContext('postgres');
        } catch (err) {
          setStatusMessage(err.response?.data?.error ?? 'Failed to generate schema context');
          await checkDbStatus('postgres');
          return;
        }
        await mergeDescriptions();
        localStorage.setItem('querify_connected', 'true');
        localStorage.setItem('querify_db_type', 'postgres');
        setShowExplorer(true);
      }
    } catch (err) {
      const error = err.response?.data;
      setStatusMessage(error?.error ? `${error.error}${error.details ? `: ${error.details}` : ''}` : 'Failed to connect');
      await checkDbStatus('postgres');
    } finally {
      setLoading(false);
    }
  };

  const connectDemo = async () => {
    setLoading(true);
    setStatusMessage('Connecting to demo DB...');
    try {
      const res = await axios.post(`${API_BASE}/db/connect-demo`);
      setStatusMessage(res.data.message || 'Connected to demo');
      const available = await checkDbStatus('postgres');
      if (available) {
        await fetchSchema('postgres');
        try {
          await generateExplorerContext('postgres');
        } catch (err) {
          setStatusMessage(err.response?.data?.error ?? 'Failed to generate schema context');
          await checkDbStatus('postgres');
          return;
        }
        await mergeDescriptions();
        localStorage.setItem('querify_connected', 'true');
        localStorage.setItem('querify_db_type', 'postgres');
        setShowExplorer(true);
      }
    } catch (err) {
      const error = err.response?.data;
      setStatusMessage(error?.error ? `${error.error}${error.details ? `: ${error.details}` : ''}` : 'Failed to connect to demo DB');
      await checkDbStatus('postgres');
    } finally {
      setLoading(false);
    }
  };

  const connectSqlServer = async () => {
    setLoading(true);
    setStatusMessage('Connecting...');
    try {
      const res = await axios.post(`${API_BASE}/db/connect-sqlserver`, {
        server: sqlServer,
        port: sqlPort,
        user: sqlUser,
        password: sqlPassword,
        database: sqlDatabase,
        instanceName: sqlInstance || undefined,
      });
      setStatusMessage(res.data.message || 'Connected');
      const available = await checkDbStatus('sqlserver');
      if (available) {
        await fetchSchema('sqlserver');
        try {
          await generateExplorerContext('sqlserver');
        } catch (err) {
          setStatusMessage(err.response?.data?.error ?? 'Failed to generate schema context');
          await checkDbStatus('sqlserver');
          return;
        }
        await mergeDescriptions();
        localStorage.setItem('querify_connected', 'true');
        localStorage.setItem('querify_db_type', 'sqlserver');
        setShowExplorer(true);
      }
    } catch (err) {
      const error = err.response?.data;
      setStatusMessage(error?.error ? `${error.error}${error.details ? `: ${error.details}` : ''}` : 'Failed to connect to SQL Server');
      await checkDbStatus('sqlserver');
    } finally {
      setLoading(false);
    }
  };

  const connectDemoSqlServer = async () => {
    setLoading(true);
    setStatusMessage('Connecting to demo SQL Server...');
    try {
      const res = await axios.post(`${API_BASE}/db/connect-demo-sqlserver`);
      setStatusMessage(res.data.message || 'Connected to demo');
      const available = await checkDbStatus('sqlserver');
      if (available) {
        await fetchSchema('sqlserver');
        try {
          await generateExplorerContext('sqlserver');
        } catch (err) {
          setStatusMessage(err.response?.data?.error ?? 'Failed to generate schema context');
          await checkDbStatus('sqlserver');
          return;
        }
        await mergeDescriptions();
        localStorage.setItem('querify_connected', 'true');
        localStorage.setItem('querify_db_type', 'sqlserver');
        setShowExplorer(true);
      }
    } catch (err) {
      const error = err.response?.data;
      setStatusMessage(error?.error ? `${error.error}${error.details ? `: ${error.details}` : ''}` : 'Failed to connect to demo SQL Server');
      await checkDbStatus('sqlserver');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    (async () => {
      const wasConnected = localStorage.getItem('querify_connected') === 'true';
      if (!wasConnected) return;
      const savedDbType = localStorage.getItem('querify_db_type') || 'postgres';
      const available = await checkDbStatus(savedDbType);
      if (available) {
        setLoading(true);
        try {
          await fetchSchema(savedDbType);
          try {
            await generateExplorerContext(savedDbType);
          } catch {
            // snapshot refresh failed on page load; proceed anyway
          }
          localStorage.setItem('querify_connected', 'true');
          setShowExplorer(true);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, []);

  const handleDisconnect = (dbType = 'postgres') => {
    localStorage.removeItem('querify_connected');
    localStorage.removeItem('querify_messages');
    localStorage.removeItem('querify_conversation_id');
    localStorage.removeItem('querify_schema');
    localStorage.removeItem('querify_ratelimit');
    localStorage.removeItem('querify_db_type');
    clearExplorerContext(dbType);
  };

  if (showExplorer) {
    const connectedDbType = localStorage.getItem('querify_db_type') || 'postgres';
    return (
      <DbExplorer
        tables={schema}
        dialect={activeDb}
        onBack={() => {
          handleDisconnect(connectedDbType);
          setShowExplorer(false);
        }}
        onExit={() => {
          handleDisconnect(connectedDbType);
        }}
      />
    );
  }

  return (
    <>
      <ColdStartBanner />
      <div className='login-shell'>
        <div className='login-card'>
          {loading && (
            <div className='login-loading-overlay'>
              <div className='login-spinner' />
              <p className='login-loading-text'>Connecting…</p>
            </div>
          )}
          <header className='login-header'>
            <div className='brand'>
              <img
                src={activeDb === 'postgres' ? postgresLogo : sqlserverLogo}
                className='logo'
                alt={activeDb === 'postgres' ? 'PostgreSQL logo' : 'SQL Server logo'}
              />
              <div className='brand-text'>
                <p className='eyebrow'>AI DB Explorer</p>
                <h1>Connect your database</h1>
                {/* <p className='subtitle'>{data?.message}</p> */}
              </div>
            </div>
            <div className={`status-pill ${dbStatus}`}>
              <span
                className='status-dot'
                aria-hidden='true'
              />
              <span>{statusMessage || 'Ready to connect'}</span>
              <span className='status-tag'>{dbStatus}</span>
            </div>
          </header>

          <div className='db-tabs'>
            <button
              className={`tab ${activeDb === 'postgres' ? 'active' : ''}`}
              onClick={() => setActiveDb('postgres')}
              type='button'
            >
              PostgreSQL
            </button>
            <button
              className={`tab ${activeDb === 'sqlserver' ? 'active' : ''}`}
              onClick={() => setActiveDb('sqlserver')}
              type='button'
            >
              SQL Server
            </button>
          </div>

          {activeDb === 'postgres' ? (
            <div className='panel'>
              <div className='fields-grid'>
                <div className='field'>
                  <label htmlFor='pg-host'>Host</label>
                  <input
                    id='pg-host'
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder='localhost'
                  />
                </div>
                <div className='field'>
                  <label htmlFor='pg-port'>Port</label>
                  <input
                    id='pg-port'
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='pg-user'>User</label>
                  <input
                    id='pg-user'
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='pg-password'>Password</label>
                  <input
                    id='pg-password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className='field field-full'>
                  <label htmlFor='pg-database'>Database</label>
                  <input
                    id='pg-database'
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                  />
                </div>
              </div>

              <div className='actions'>
                <button
                  className='btn primary'
                  onClick={connect}
                  type='button'
                  disabled={loading}
                >
                  Connect
                </button>
                <button
                  className='btn ghost'
                  onClick={connectDemo}
                  type='button'
                  disabled={loading}
                >
                  Use Demo DB
                </button>
              </div>
            </div>
          ) : (
            <div className='panel'>
              <div className='fields-grid'>
                <div className='field'>
                  <label htmlFor='ms-server'>Server</label>
                  <input
                    id='ms-server'
                    value={sqlServer}
                    onChange={(e) => setSqlServer(e.target.value)}
                    placeholder='localhost'
                  />
                </div>
                <div className='field'>
                  <label htmlFor='ms-port'>Port</label>
                  <input
                    id='ms-port'
                    value={sqlPort}
                    onChange={(e) => setSqlPort(e.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='ms-user'>User</label>
                  <input
                    id='ms-user'
                    value={sqlUser}
                    onChange={(e) => setSqlUser(e.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='ms-password'>Password</label>
                  <input
                    id='ms-password'
                    type='password'
                    value={sqlPassword}
                    onChange={(e) => setSqlPassword(e.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='ms-database'>Database</label>
                  <input
                    id='ms-database'
                    value={sqlDatabase}
                    onChange={(e) => setSqlDatabase(e.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='ms-instance'>Instance (optional)</label>
                  <input
                    id='ms-instance'
                    value={sqlInstance}
                    onChange={(e) => setSqlInstance(e.target.value)}
                    placeholder='SQLEXPRESS'
                  />
                </div>
              </div>

              <div className='actions'>
                <button
                  className='btn primary'
                  onClick={connectSqlServer}
                  type='button'
                  disabled={loading}
                >
                  Connect
                </button>
                <button
                  className='btn ghost'
                  onClick={connectDemoSqlServer}
                  type='button'
                  disabled={loading}
                >
                  Use Demo DB
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
