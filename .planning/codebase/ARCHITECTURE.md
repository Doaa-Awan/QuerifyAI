# Architecture

**Analysis Date:** 2026-03-09

## Pattern Overview

**Overall:** Client-server SPA with server-side MVC

**Key Characteristics:**
- React SPA (client) communicates with Express REST API (server) over HTTP
- Server follows a strict layered MVC: routes → controllers → services → repositories → db
- AI SQL generation uses a two-pass pipeline: table selection pass then SQL generation pass
- In-memory state for DB pool, conversations, and schema; no persistent store
- Session-based auth (express-session) gates DB endpoints; rate limiting on AI and snapshot endpoints

## Layers

**Routes:**
- Purpose: Map HTTP verbs + paths to controller handlers; attach middleware (rate limiters)
- Location: `server/routes.js`
- Contains: All route definitions in a single Express Router
- Depends on: Controllers, middleware
- Used by: `server/server.js` via `app.use(router)`

**Controllers:**
- Purpose: Validate input with Zod, delegate to services, format HTTP responses
- Location: `server/controllers/chat.controller.js`, `server/controllers/postgres.controller.js`
- Contains: Zod schemas for request bodies, thin handler methods
- Depends on: Services, schemaStore
- Used by: Routes

**Services:**
- Purpose: Application logic; AI orchestration, DB introspection, snapshot generation
- Location: `server/services/chat.service.js`, `server/services/postgres.service.js`, `server/services/introspection.js`
- Contains: Two-pass AI pipeline, PII sanitization, snapshot markdown generation, pool management
- Depends on: Repositories, db layer, OpenAI client, fs
- Used by: Controllers

**Repositories:**
- Purpose: In-memory data access; connection pool state and conversation message history
- Location: `server/repositories/postgres.repository.js`, `server/repositories/conversation.repository.js`
- Contains: Module-level Maps/objects as singleton stores; CRUD interface over them
- Depends on: Nothing (pure in-memory)
- Used by: Services

**DB Layer:**
- Purpose: Raw SQL queries against PostgreSQL via `pg` Pool; no ORM
- Location: `server/db/postgres.js`
- Contains: `getSchema`, `getTables`, `getSampleRows`, `getRowCounts` — all accept a pool argument
- Depends on: `pg` driver; pool passed in from caller
- Used by: Services directly, `introspection.js`

**Shared In-Memory Stores:**
- Purpose: Singleton state not tied to a request lifecycle
- Location: `server/services/schemaStore.js` (introspected schema), `server/repositories/postgres.repository.js` (pool), `server/repositories/conversation.repository.js` (message history), `topicCache` Map inside `server/services/chat.service.js` (per-conversation table cache)
- All stores live in Node process memory — not shared across multiple processes

**Frontend Shell:**
- Purpose: Root routing between login screen and explorer; manages DB connection flow
- Location: `client/src/App.jsx`
- Contains: Connection form, demo connect, schema fetch, session persistence via localStorage
- Depends on: axios, DbExplorer component
- Used by: `client/src/main.jsx`

**Frontend Explorer:**
- Purpose: Layout shell for the explorer view; sidebar schema browser, ERD modal, ChatBot
- Location: `client/src/DbExplorer.jsx`
- Contains: Expanded/highlighted table state, column tooltip state, dialect picker
- Depends on: ChatBot, ERDModal
- Used by: App.jsx (conditional render when connected)

**Frontend Chat:**
- Purpose: Manage chat messages, submit prompts to API, render AI responses with SQL highlighting
- Location: `client/src/components/chat/ChatBot.jsx`, `client/src/components/chat/ChatMessages.jsx`, `client/src/components/chat/ChatInput.jsx`
- Contains: Message list state (localStorage-persisted), axios POST to `/api/chat`, ReactMarkdown with custom `CopyPre` renderer
- Depends on: axios, react-markdown, react-syntax-highlighter

## Data Flow

**DB Connection Flow:**

1. User fills form in `client/src/App.jsx` and clicks Connect
2. `App.jsx` POSTs credentials to `POST /db/connect` (or `/db/connect-demo`)
3. `postgres.controller.js` validates with Zod, calls `postgresService.connect()`
4. `postgres.service.js` creates a `pg.Pool`, runs `SELECT 1`, calls `postgresRepository.replacePool()`
5. On success, controller calls `connectAndIntrospect` which also runs `writeExplorerSnapshot` and `introspectionService.introspect()`
6. `schemaStore.set()` stores the full introspected schema in memory
7. AI-generated table descriptions are written to `server/prompts/table-metadata.json`
8. Full schema snapshot is written to `server/prompts/db-explorer-context.md`
9. `App.jsx` sets `localStorage.querify_connected = 'true'`, switches to `DbExplorer` view

**Chat / SQL Generation Flow:**

1. User types a question in `ChatInput.jsx`; `ChatBot.jsx` POSTs to `POST /api/chat`
2. `chat.controller.js` validates prompt + conversationId with Zod
3. `chatService.sendMessage()` begins two-pass AI pipeline:
   - **Pass 1 (table selection):** Sends table names + descriptions from `table-metadata.json` to `gpt-4o-mini`; receives JSON array of relevant table names
   - Follow-up detection via `isFollowUpQuery()` heuristic; cache hit skips pass 1
   - `topicCache` (Map keyed by conversationId) stores selected tables for follow-ups
   - **Pass 2 (SQL generation):** Builds focused schema context string from selected tables + sample rows; includes last 10 conversation messages; sends structured JSON schema response format
4. Response `{ sql, explanation, tables_used }` returned to `ChatBot.jsx`
5. `ChatBot.jsx` formats markdown with fenced SQL block; appends to `messages` state
6. `ChatMessages.jsx` renders via `ReactMarkdown`; `CopyPre` component auto-detects SQL and renders with SSMS syntax theme from `ssmsTheme.js`
7. `tables_used` propagates to `DbExplorer.jsx` via `onTablesUsed` callback; sidebar tables become highlighted

**Schema Store Flow:**

1. `connectAndIntrospect` calls `introspectionService.introspect(pool)` → returns structured table objects with columns, FK relationships, row counts, sanitized sample values
2. `schemaStore.set({ tables, descriptions })` stores in module-level variable
3. `GET /api/schema` → `postgresController.getIntrospectedSchema()` reads from `schemaStore` and returns tables + flattened relationships array
4. `App.jsx` separately fetches `GET /db/schema` (raw rows) to build its sidebar table list

**State Management:**

- Server state: module-level singletons (pool, conversations Map, schemaStore, topicCache Map)
- Client state: React `useState` in `App.jsx` and `DbExplorer.jsx`; `ChatBot.jsx` persists messages and conversationId to `localStorage`
- Schema list is cached in `localStorage` as `querify_schema` for reconnect

## Key Abstractions

**Two-Pass AI Pipeline:**
- Purpose: Reduce token usage by selecting only relevant tables before SQL generation
- Files: `server/services/chat.service.js` — `selectRelevantTables()`, `buildPartialSchemaContext()`, `topicCache`
- Pattern: Pass 1 uses `temperature: 0` low-latency call; Pass 2 uses structured JSON output with strict schema

**PII Sanitizer:**
- Purpose: Replace personal data in sample rows before writing to prompts or sending to AI
- Files: `server/services/postgres.service.js` — `isLikelyPiiColumn()`, `buildDummyValue()`, `sanitizeSamples()`
- Pattern: Column-name pattern matching + value heuristics (email regex, phone digit count); replaces with synthetic values like `user1@example.com`

**Schema Snapshot:**
- Purpose: Persist DB schema + sample rows as markdown for AI context
- Files: `server/services/postgres.service.js` — `writeExplorerSnapshot()`, `buildSnapshotMarkdown()`; output: `server/prompts/db-explorer-context.md`, `server/prompts/table-metadata.json`
- Pattern: Written to disk on connect; read back as string to inject into AI system prompt via `{{dbSchema}}` placeholder in `server/prompts/chatbot.txt`

**CopyPre Component:**
- Purpose: Custom ReactMarkdown renderer that adds copy button and SQL syntax highlighting to code blocks
- Files: `client/src/components/chat/ChatMessages.jsx`
- Pattern: Wraps `<pre>` elements; detects SQL via language class or `SQL_START` regex; uses `PrismLight` with custom SSMS theme

**ERD Modal:**
- Purpose: Visualize FK relationships between tables as an interactive diagram
- Files: `client/src/components/ERDModal.jsx`
- Pattern: BFS layout from most-connected table; SVG lines with orthogonal routing; pan + zoom via mouse events; no external diagram library

## Entry Points

**Backend:**
- Location: `server/server.js`
- Triggers: `node server.js` or npm start
- Responsibilities: Load env, configure CORS from `ALLOWED_ORIGINS`, configure express-session, mount router, listen on `PORT`

**Frontend:**
- Location: `client/src/main.jsx`
- Triggers: Vite dev server or nginx serve of built `dist/`
- Responsibilities: Mount `<App />` to `#root` in StrictMode

**Primary Routes:**
- `POST /db/connect` — connect user DB, trigger snapshot + introspection
- `POST /db/connect-demo` — connect using server env demo credentials
- `POST /api/connect` — alternate combined connect + introspect endpoint
- `POST /api/chat` — accept NL prompt, return `{ sql, explanation, tables_used }`
- `GET /db/schema` — return raw schema rows (used by App.jsx for sidebar)
- `GET /api/schema` — return introspected schema with FK relationship list
- `POST /db/explorer-context/snapshot` — regenerate context files
- `POST /db/explorer-context/clear` — clear context files and schemaStore

## Error Handling

**Strategy:** Services return result objects `{ ok: boolean, error?, status?, body? }`; controllers translate these to HTTP status codes

**Patterns:**
- Service methods never throw to controllers; all errors caught internally and returned as `{ ok: false, error, status }`
- Controller pattern: `if (!result.ok) { res.status(result.status || 500).json({ error: ... }); return; }`
- DB layer functions throw on error; callers (services) wrap in try/catch
- Zod `safeParse` used in all controllers; malformed requests return 400 with formatted error
- AI JSON parse failures fall back gracefully: `{ sql: null, explanation: rawContent, tables_used: [] }`
- Frontend: axios errors caught in `catch (err)` blocks; user-visible `statusMessage` or `error` state set

## Cross-Cutting Concerns

**Rate Limiting:** `express-rate-limit` via `server/middleware/rateLimiter.js`; `chatLimiter` (20/day) on `POST /api/chat`; `snapshotLimiter` (5/hr) on `POST /db/explorer-context/snapshot`

**Session Auth:** `requireSession` middleware in `server/middleware/requireSession.js`; checks `req.session.connected === true`; set by `postgres.controller.js` after successful `connectAndIntrospect`

**Security Headers:** `helmet()` applied in `server/server.js` (X-Content-Type-Options, X-Frame-Options, CSP)

**Validation:** All inbound request bodies validated with Zod in controllers before any service call; enumerated fields only (no `.passthrough()`)

**Logging:** `console.log` with `[namespace]` prefix (e.g., `[chat]`, `[snapshot]`) in services; no structured logging framework

---

*Architecture analysis: 2026-03-09*
