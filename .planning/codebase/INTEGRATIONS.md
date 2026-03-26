# External Integrations

**Analysis Date:** 2026-03-09

## APIs & External Services

**AI / LLM:**
- OpenRouter — Proxies requests to `gpt-4o-mini`; used for all AI features
  - SDK/Client: `openai` npm package (v6.16.0) with `baseURL` overridden to `https://openrouter.ai/api/v1`
  - Auth: `OPENROUTER_API_KEY` env var
  - Used in: `server/services/chat.service.js` (chat completions), `server/services/postgres.service.js` (table description generation)
  - Two distinct call sites:
    1. `chat.service.js` — Pass 1 table selection (model: `gpt-4o-mini`, temp: 0, max_tokens: 50) + Pass 2 SQL generation (temp: 0.2, max_tokens: 800, structured JSON output via `json_schema` response format)
    2. `postgres.service.js` → `generateTableDescriptions()` — One-shot table description call (temp: 0.2, max_tokens: 600)

## Data Storage

**Databases:**
- PostgreSQL (user-supplied) — Users connect their own PostgreSQL instance
  - Connection: credentials submitted via `POST /db/connect` request body (host, port, user, password, database, ssl, options)
  - Demo DB: optional server-configured PostgreSQL instance via `DEMO_DB_HOST`, `DEMO_DB_PORT`, `DEMO_DB_USER`, `DEMO_DB_PASSWORD`, `DEMO_DB_NAME`, `DEMO_DB_SSL`, `DEMO_DB_OPTIONS` env vars
  - Client: `pg` npm package (v8.16.3) using `Pool` for connection management
  - Pool managed in: `server/repositories/postgres.repository.js` (single in-memory pool per server process)
  - SSL: optional, configured per-connection via `ssl` field; uses `{ rejectUnauthorized: false }` when enabled
- SQL Server (user-supplied) — Fully implemented alongside PostgreSQL
  - Connection: credentials submitted via `POST /db/connect-sqlserver` request body
  - Demo DB: optional server-configured SQL Server instance via `DEMO_MSSQL_*` env vars
  - Client: `mssql` npm package (v11.0.1)
  - Handled by: `server/controllers/mssql.controller.js`, `server/services/mssql.service.js`

**File Storage:**
- Local filesystem — Schema snapshots and table metadata written to `server/prompts/` at runtime
  - `server/prompts/db-explorer-context.md` — Generated Markdown snapshot of connected DB schema + sample rows (PII-masked)
  - `server/prompts/table-metadata.json` — JSON file with AI-generated table descriptions, column metadata, sample rows; drives two-pass table selection
  - Files are cleared on DB Explorer exit via `POST /db/explorer-context/clear`

**Caching:**
- In-memory `Map` — Per-conversation topic cache in `server/services/chat.service.js` (`topicCache: Map<conversationId, { query, tables }>`)
- In-memory object — DB pool state in `server/repositories/postgres.repository.js`
- In-memory object — Introspected schema in `server/services/schemaStore.js`
- `localStorage` — Client-side message persistence (`querify_messages` key) in `client/src/DbExplorer.jsx`

## Authentication & Identity

**Auth Provider:**
- Custom / None — No third-party identity provider
  - Implementation: `express-session` (v1.19.0) sets `req.session.connected = true` on successful DB connect (`POST /api/connect`)
  - Session middleware: `server/middleware/requireSession.js` checks `req.session.connected === true`; returns 401 if unset
  - Session cookie: `httpOnly: true`, `secure: true` in production, `sameSite: lax`, 8-hour `maxAge`
  - Secret: `SESSION_SECRET` env var (mandatory in production; weak default provided for dev)

## Monitoring & Observability

**Error Tracking:**
- None — No Sentry, Datadog, or similar service integrated

**Logs:**
- `console.log` / `console.warn` — Used throughout server services for operational visibility
  - Examples: `[chat] pass 1 result:`, `[snapshot] tables found:`, `[snapshot] descriptions received:`
  - No structured logging library (no Winston, Pino, etc.)

## CI/CD & Deployment

**Hosting:**
- Docker — `server/Dockerfile`, `client/Dockerfile`, `docker-compose.yml`; client served by nginx; Railway integration for production deployment

**CI Pipeline:**
- GitHub Actions — `.github/workflows/`; auto-promotes production branch when CI passes on main

## Environment Configuration

**Required env vars (server):**
- `OPENROUTER_API_KEY` — Without this, all AI features fail at runtime
- `SESSION_SECRET` — Without this, a weak dev default is used (security risk in production)
- `PORT` — Optional; defaults to 8080

**Optional env vars (server):**
- `ALLOWED_ORIGINS` — Defaults to `http://localhost:5173,http://localhost:5174` if absent
- `DEMO_DB_HOST`, `DEMO_DB_PORT`, `DEMO_DB_USER`, `DEMO_DB_PASSWORD`, `DEMO_DB_NAME`, `DEMO_DB_SSL`, `DEMO_DB_OPTIONS` — Enables the "Use Demo DB" button in the UI

**Secrets location:**
- `server/.env` (not committed; template at `server/.env.example`)
- `client/.env` (present; likely contains `VITE_*` vars for frontend API base URL)

## Webhooks & Callbacks

**Incoming:**
- None — No webhook receiver endpoints

**Outgoing:**
- None — All external calls are request-initiated (OpenRouter AI calls triggered by user chat messages or snapshot builds)

## Internal API Surface

**REST endpoints exposed by server:**
- `GET  /api` — Health ping
- `POST /api/query` — Main NL→SQL endpoint (rate-limited: 20/day per IP); returns `{ sql, explanation, tablesUsed }`
- `POST /api/chat` — Legacy SSE streaming endpoint (not used by current UI)
- `POST /api/connect` — Connect DB + run introspection + AI descriptions (combined flow)
- `GET  /api/schema` — Return introspected schema from in-memory store
- `POST /db/connect` — Connect PostgreSQL DB
- `POST /db/connect-demo` — Connect to server-configured PostgreSQL demo DB
- `POST /db/connect-sqlserver` — Connect SQL Server DB
- `POST /db/connect-demo-sqlserver` — Connect to server-configured SQL Server demo DB
- `GET  /db/status` — Check PostgreSQL pool availability
- `GET  /db/status-sqlserver` — Check SQL Server connection availability
- `GET  /health/db` — Run liveness check
- `GET  /db/schema` — Raw PostgreSQL schema rows from `information_schema`
- `GET  /db/schema-sqlserver` — Raw SQL Server schema rows
- `POST /db/explorer-context/snapshot` — Build PostgreSQL schema snapshot + AI descriptions (rate-limited: 5/hr per IP)
- `POST /db/explorer-context/snapshot-sqlserver` — Build SQL Server schema snapshot
- `POST /db/explorer-context/clear` — Delete snapshot files + clear in-memory store

**Dev proxy (Vite):**
- `client/vite.config.js` proxies `/api`, `/db`, `/health` → `http://localhost:8080` during development

---

*Integration audit: 2026-03-24*
