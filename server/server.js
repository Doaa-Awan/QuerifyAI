//.env config
require('dotenv').config();
const express = require('express');

const {
  createPostgresClient,
} = require("./db/postgres");

const app = express();

//cors
const cors = require('cors');
const corsOptions = {
  origin: ['http://localhost:5173'], 
//   methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
//   allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
};

app.use(cors(corsOptions));
app.use(express.json());

// Create pool ONCE at startup
let dbPool;
let dbAvailable = false;
try {
  dbPool = createPostgresClient({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
} catch (err) {
  console.error("❌ Failed to create Postgres client", err);
  dbPool = null;
  dbAvailable = false;
}

// Optional: test connection on startup, but do NOT exit if it fails
let retryInterval = null;

async function testAndSetDb(config) {
  if (!config) return { ok: false, error: 'No config provided' };

  const candidatePool = createPostgresClient(config);
  try {
    // Try a lightweight query to validate the credentials
    await candidatePool.query("SELECT 1");

    // Close old pool if it exists
    if (dbPool && dbPool !== candidatePool) {
      try { await dbPool.end(); } catch (e) { /* ignore */ }
    }

    dbPool = candidatePool;
    dbAvailable = true;
    console.log("✅ Connected to Postgres");

    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }

    return { ok: true };
  } catch (err) {
    // Candidate failed — clean up and return false with reason
    try { await candidatePool.end(); } catch (e) { /* ignore */ }
    console.error('testAndSetDb error:', err.message);
    return { ok: false, error: err.message };
  }
}

function startRetryLoop() {
  if (retryInterval) return;
  retryInterval = setInterval(async () => {
    const cfg = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' || false,
    };

    const result = await testAndSetDb(cfg);
    if (result.ok) {
      console.log("✅ Reconnected to Postgres via retry loop");
    } else {
      // optionally log a short message but don't spam
      // console.debug('Retry failed:', result.error);
    }
  }, 30000);
}

(async () => {
  // Try initial connection if there was a pool config
  if (dbPool) {
    const initialCfg = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' || false,
    };

    const result = await testAndSetDb(initialCfg);
    if (!result.ok) {
      dbAvailable = false;
      console.warn("⚠️ Continuing without DB connection. Server will still serve frontend, but DB routes will return 503.");
      console.warn('Initial DB connect error:', result.error);
      startRetryLoop();
    }
  } else {
    console.warn("⚠️ No Postgres client available. Server will continue without DB.");
    startRetryLoop();
  }
})();

// -- New endpoints: POST /db/connect and /db/connect-demo and GET /db/status
app.post('/db/connect', async (req, res) => {
  const { host, port, user, password, database, ssl } = req.body;
  const cfg = { host, port, user, password, database, ssl };

  try {
    const result = await testAndSetDb(cfg);
    if (result.ok) {
      console.log('DB connected via /db/connect (user:', user, 'db:', database, ')');
      return res.json({ message: 'Connected' });
    }

    console.warn('Failed /db/connect attempt:', result.error);
    return res.status(500).json({ error: 'Failed to connect with provided credentials', details: result.error });
  } catch (err) {
    return res.status(500).json({ error: 'Error while trying to connect to DB' });
  }
});

app.post('/db/connect-demo', async (req, res) => {
  const demoCfg = {
    host: process.env.DEMO_DB_HOST,
    port: process.env.DEMO_DB_PORT,
    user: process.env.DEMO_DB_USER,
    password: process.env.DEMO_DB_PASSWORD,
    database: process.env.DEMO_DB_NAME,
    ssl: process.env.DEMO_DB_SSL === 'true' || false,
  };

  if (!demoCfg.host || !demoCfg.user || !demoCfg.database) {
    return res.status(400).json({ error: 'Demo DB credentials are not configured on the server' });
  }

  console.log('Attempting demo connect to', { host: demoCfg.host, port: demoCfg.port, user: demoCfg.user, database: demoCfg.database });

  const result = await testAndSetDb(demoCfg);
  if (result.ok) {
    console.log('Demo DB connected via /db/connect-demo');
    return res.json({ message: 'Connected to demo DB' });
  }

  console.warn('Demo connect failed:', result.error);
  return res.status(500).json({ error: 'Failed to connect to demo DB', details: result.error });
});

app.get('/db/status', (req, res) => {
  res.json({ available: !!dbAvailable });
});

const PORT = process.env.VITE_PORT || 5000;

app.get("/api", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.get("/health/db", async (req, res) => {
  if (!dbPool || !dbAvailable) {
    return res.status(503).json({ status: "unavailable", error: "DB connection not available" });
  }

  try {
    const result = await dbPool.query("SELECT NOW()");
    res.json({
      status: "ok",
      time: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { getSchema } = require("./db/postgres");

app.get("/db/schema", async (req, res) => {
  if (!dbPool || !dbAvailable) {
    return res.status(503).json({ error: "DB connection not available" });
  }

  try {
    const schema = await getSchema(dbPool);
    res.json(schema);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});