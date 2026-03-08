# Querify — AI Database Explorer
## Project Specification

> Last updated: 2026-03-08 (session 1)

---

## Implementation Status

| Area | Status |
|---|---|
| Schema introspection engine (`introspection.js`) | ✅ Done |
| In-memory schema store (`schemaStore.js`) | ✅ Done |
| `POST /api/connect` — connect + introspect + AI descriptions | ✅ Done |
| `GET /api/schema` — structured schema + relationships | ✅ Done |
| `db/postgres.js` — `is_nullable`, `getRowCounts` | ✅ Done |
| Frontend localStorage persistence (session, schema, messages) | ✅ Done |
| `POST /api/query` + `aiPipeline.js` | ⬜ Next |
| `cache.js` — query result caching | ⬜ Todo |
| Querify frontend components (ConnectionForm, SchemaExplorer, etc.) | ⬜ Todo |
| ERD visualization (React Flow or D3) | ⬜ Todo |
| Rate limit banner + cold start loading state | ⬜ Todo |

---

## Purpose

Querify is a **privacy-first database schema exploration and SQL generation tool** built for developers navigating databases they didn't build — undocumented schemas, non-obvious table names, relationships you have to reverse-engineer just to write your first query.

**The origin:** Built after joining a company whose PSA database had no documentation. The table storing tickets was called `faults`. Invoice, device, and client relationships were non-obvious. Writing any meaningful query required trial-and-error exploration. Querify solves that.

**What it does:**
- Connects to a PostgreSQL database and automatically maps the entire schema
- Generates AI-powered plain-English descriptions of each table
- Renders an interactive ERD (Entity Relationship Diagram) visualization
- Accepts natural language questions and returns accurate SQL via a two-pass AI pipeline
- Does all of this **without sending sensitive data to the LLM**

**What it is NOT:**
- Not a natural language query tool that returns data results directly
- Not suitable for non-technical users who can't verify SQL output
- Not a reporting or BI tool
- The AI helps you write the query — you still run it yourself

**Honest positioning:**
> "The fastest way to understand a database you didn't build."

---

## Target Audience

1. **Developers onboarding at a new company** — understand an inherited schema quickly
2. **Freelancers and contractors** inheriting client databases
3. **Small technical teams** without a dedicated DBA or data analyst

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React, JavaScript, Vite, custom CSS (dark theme) | No Tailwind — uses CSS variables |
| Backend | Node.js, Express 5 | ES modules throughout |
| Database | PostgreSQL (via `pg` npm package) | |
| AI | OpenRouter API (model: `gpt-4o-mini`) | Two-pass pipeline |
| ERD Visualization | Custom SVG + BFS layout | React Flow/D3 planned for future |
| Deployment | Frontend → Vercel, Backend → Railway, Sample DB → Neon/Supabase | |

---

## Architecture Overview

```
Frontend (React/JS)
      │
      ▼
Express Backend (Node.js)
      │
      ├── PostgreSQL Connection Layer (pg)
      │         │
      │         └── Schema Introspection Engine  ← introspection.js ✅
      │                   │
      │                   └── Sanitization Layer (scrambles PII)
      │
      ├── In-Memory Schema Store  ← schemaStore.js ✅
      │
      └── OpenRouter API Proxy
                │
                └── Two-Pass AI Pipeline  ← aiPipeline.js (todo)
```

---

## Core Features

### 1. Schema Introspection Engine ✅
- Queries `information_schema` and `pg_catalog` to extract:
  - All tables and their purposes
  - All columns with data types, nullability, PK/FK flags
  - Foreign key relationships
  - Row counts (via `pg_stat_user_tables.n_live_tup` — fast, lock-free)
- Pulls top 10 records per table for context (PII-sanitized before AI use)
- Runs **at connection time** — zero manual configuration required
- Returns structured `TableSchema[]` data directly to the frontend

**Data shapes:**
```js
// TableSchema
{
  name: string,
  description: string,       // AI-generated one-sentence description
  columns: Column[],
  primaryKey: string,        // first PK column name
  foreignKeys: ForeignKey[],
  rowCount: number           // approximate from pg_stat_user_tables
}

// Column
{
  name: string,
  type: string,
  nullable: boolean,
  isPrimaryKey: boolean,
  isForeignKey: boolean,
  sampleValues: string[]     // sanitized, from top 10 rows
}

// ForeignKey
{
  column: string,
  referencedTable: string,
  referencedColumn: string
}
```

### 2. Privacy-First Sanitization Layer ✅
- Before any data is sent to the LLM, the sanitization layer:
  - Detects likely PII columns by column name pattern matching
  - Scrambles/replaces values with realistic but fake data
  - Preserves data types and structure
- **No real user data ever leaves the database environment**

**PII detection patterns:**
```
email, phone, mobile, name, firstname, lastname, fullname, dob, birth,
address, street, city, state, zip, postal, country, username, password,
passcode, token, secret, api_key, ssn, social_security, passport
```

**Sanitization strategy:**
- Email → `user_N@example.com`
- Phone/mobile → `555010NNN`
- Names → `FirstNameN`, `LastNameN`, `Name N`
- Address/street → `1NN Example St`
- Password/token/secret → `redacted_N`
- Generic strings → `redacted_N`
- Numbers → row index N
- Booleans → preserved as-is
- Dates → preserved as-is

### 3. AI Table Description Generation ✅
- After introspection, sends table names + column names to OpenRouter
- Receives one plain-English sentence per table describing its purpose
- Stored in the in-memory schema store and returned directly to the frontend
- Gracefully degrades — descriptions default to empty string if AI call fails

### 4. In-Memory Schema Store ✅
- `schemaStore.js` — module-level singleton with `set()`, `get()`, `clear()`, `isAvailable()`
- Populated by `connectAndIntrospect()` after successful connection
- Cleared on `clearExplorerSnapshot()` (session end)
- Powers `GET /api/schema` without re-querying the database

### 5. Two-Pass AI Query Pipeline (per query) — TODO

**Pass 1 — Table Selection:**
```
Input:  User's natural language question + all table names + AI descriptions
Output: JSON array of relevant table names
Example: ["faults", "clients", "invoices"]
```

**Pass 2 — SQL Generation:**
```
Input:  User's question + full schema (columns, types, FKs) for relevant tables only
Output: Structured JSON { sql, explanation, tables_used }
```

**Why two passes:**
- Reduces token usage significantly on large schemas
- Improves SQL accuracy by only injecting relevant context
- Pass 1 result is cached for similar repeated queries
- Falls back to full schema injection if Pass 1 fails

**Structured output format:**
```json
{
  "sql": "SELECT f.id, f.status, c.name FROM faults f JOIN clients c ON f.client_id = c.id WHERE f.status = 'open'",
  "explanation": "Retrieves all open tickets with their associated client names.",
  "tables_used": ["faults", "clients"]
}
```

### 6. ERD Visualization — partial (custom SVG, React Flow/D3 planned)
- Renders interactive node-based diagram from live schema data
- Each table is a node showing column names and data types
- Foreign key relationships rendered as connecting edges
- Zoomable, pannable, draggable
- `GET /api/schema` returns `relationships[]` derived from FK data for use by the ERD renderer

### 7. Rate-Limited API Proxy ✅
- All OpenRouter calls go through the Express backend — API key never exposed to frontend
- Rate limiting: 20 AI requests per IP per day on the live demo instance
- Frontend displays visible banner: "Demo limited to 20 queries/day — clone repo to connect your own database"

### 8. Session Persistence ✅
Frontend localStorage keys — all cleared on Back/Exit:

| Key | Value | Purpose |
|---|---|---|
| `querify_connected` | `"true"` | Prevents login flash on refresh |
| `querify_schema` | JSON `TableSchema[]` | Sidebar + ERD on refresh without re-fetch |
| `querify_messages` | JSON `Message[]` | Chat history survives refresh |
| `querify_conversation_id` | UUID string | AI conversation context survives refresh |

---

## API Endpoints

```
POST /api/connect                         ✅ implemented
  Body: { host, user, database, [port, password, ssl, options] }
  Returns: { tables: TableSchema[], descriptions: Record<string, string> }

GET /api/schema                           ✅ implemented
  Returns: { tables: TableSchema[], relationships: Relationship[] }

POST /api/query                           ⬜ todo (currently /api/chat exists)
  Body: { question: string, history: Message[] }
  Returns: { sql: string, explanation: string, tablesUsed: string[] }

GET /api/health                           ✅ (as GET /api)
  Returns: { message: string }

--- Legacy endpoints (still active) ---
POST /db/connect                          ✅ (simple connect, no introspection)
POST /db/connect-demo                     ✅
GET  /db/status                           ✅
GET  /health/db                           ✅
GET  /db/schema                           ✅ (returns raw DB rows, not TableSchema[])
POST /db/explorer-context/snapshot        ✅
POST /db/explorer-context/clear           ✅
```

**Relationship shape (from GET /api/schema):**
```js
{
  fromTable: string,
  fromColumn: string,
  toTable: string,
  toColumn: string
}
```

---

## Backend File Structure

```
server/
├── controllers/
│   ├── chat.controller.js           # POST /api/chat (legacy)
│   └── postgres.controller.js       # All DB + introspection endpoints
├── services/
│   ├── introspection.js             # ✅ Schema introspection engine
│   ├── schemaStore.js               # ✅ In-memory schema persistence
│   ├── postgres.service.js          # Connection, snapshot, connectAndIntrospect
│   ├── chat.service.js              # Two-pass AI (legacy /api/chat)
│   ├── aiPipeline.js                # ⬜ TODO: new two-pass pipeline for /api/query
│   └── cache.js                     # ⬜ TODO: query result caching
├── repositories/
│   ├── postgres.repository.js       # pg.Pool singleton
│   └── conversation.repository.js   # In-memory message history
├── middleware/
│   ├── rateLimiter.js               # chatLimiter, snapshotLimiter, connectLimiter
│   └── requireSession.js            # session guard
├── db/
│   └── postgres.js                  # SQL helpers: getSchema, getTables, getSampleRows, getRowCounts
├── routes.js
└── server.js
```

---

## Frontend File Structure

```
client/src/
├── App.jsx                          # Login form + DB connect, localStorage session management
├── DbExplorer.jsx                   # Main layout shell, sidebar, ERD trigger
├── main.jsx
├── components/
│   ├── ERDModal.jsx                 # Interactive ERD (custom SVG/BFS layout)
│   └── chat/
│       ├── ChatBot.jsx              # Conversation state, localStorage persistence
│       ├── ChatInput.jsx
│       ├── ChatMessages.jsx
│       └── TypingIndicator.tsx
├── App.css
└── index.css

--- Querify target components (TODO) ---
├── components/
│   ├── ConnectionForm.jsx           # DB connection string input
│   ├── SchemaExplorer.jsx           # Table list with AI descriptions
│   ├── ERDVisualization.jsx         # React Flow / D3 based (replaces ERDModal)
│   ├── QueryInterface.jsx           # Natural language input + SQL output
│   ├── SQLDisplay.jsx               # Formatted SQL with copy button
│   ├── RateLimitBanner.jsx          # Demo usage warning
│   └── LoadingSpinner.jsx           # Railway cold start handling
├── hooks/
│   ├── useSchema.js                 # Schema state management
│   └── useQuery.js                  # Query history + API calls
└── utils/
    └── api.js                       # API call helpers
```

---

## Sample Database

The live demo connects to a pre-loaded Neon/Supabase PostgreSQL database. Tables include:

```sql
accounts          -- SaaS customer accounts
users             -- Individual users within accounts
subscriptions     -- Plan and billing info per account
invoices          -- Billing history
feature_flags     -- Per-account feature toggles
events            -- User activity log
support_tickets   -- Internal support requests
integrations      -- Third-party connections per account
```

---

## Demo Flow (for portfolio/interviews)

The demo should show three things in under 2 minutes:

1. **Connect** — paste a connection string, watch schema map instantly
2. **Query** — type "show me all accounts on the pro plan with their invoice total this month", watch Pass 1 identify relevant tables, Pass 2 return accurate SQL
3. **ERD** — click the diagram tab, show the visual schema with relationships

---

## Deployment

| Service | Provider | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploy from main branch |
| Backend | Railway | Free tier, spins down after inactivity |
| Sample DB | Neon | Serverless PostgreSQL, always on |

**Cold start handling:** Railway backend spins down after ~10 min inactivity. Frontend shows a loading state with message "Waking up the server, this takes ~15 seconds on first load" rather than appearing broken.

---

## Branding

- **Name:** Querify
- **Tagline:** Plain English. Real SQL.
- **Sub-tagline:** For databases you didn't build.
- **App header copy:**
  > **Querify**
  > Plain English. Real SQL.
  > Connect a database, ask questions, get queries back — without exposing your data.

---

## Known Limitations

1. **PostgreSQL only** in v1 — SQL Server and MySQL support planned
2. **Schema understanding only** — does not query and return live data results
3. **Not for non-technical users** — generated SQL must be verified before running
4. **Demo rate limited** to 20 queries/day per IP
5. **Railway cold start** adds 10-30 second delay on first request
6. **In-memory cache only** — schema store and query history clear on server restart
7. **Single-process only** — pg.Pool Map lives in server memory, not shared across Node processes
8. **`primaryKey` is a single string** — composite PKs are not fully supported (first PK column is used)
9. **`n_live_tup` row counts** — approximate; may read 0 for tables that have never been vacuumed
