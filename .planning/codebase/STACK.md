# Technology Stack

**Analysis Date:** 2026-03-09

## Languages

**Primary:**
- JavaScript (ES2020+) - All source code, both client and server
- JSX - React component templates in `client/src/`

**Secondary:**
- CSS - Custom styling in `client/src/index.css`, `client/src/App.css` (no Tailwind, no CSS modules)

## Runtime

**Environment:**
- Node.js - Server runtime (version not pinned; no `.nvmrc` or `.node-version` present)

**Package Manager:**
- npm - Used in all three package scopes (root, client, server)
- Lockfiles: `package-lock.json` present at root, `client/`, and `server/`

## Frameworks

**Core (Client):**
- React 19.2.0 - UI rendering (`client/src/`)
- Vite 7.2.4 - Dev server, build tool, HMR (`client/vite.config.js`)

**Core (Server):**
- Express 5.2.1 - HTTP server, routing (`server/server.js`, `server/routes.js`)

**Forms:**
- react-hook-form 7.71.1 - DB connection form in `client/src/`

**Testing:**
- None - No test framework installed; `server/package.json` scripts.test exits with error

**Build/Dev:**
- nodemon 3.1.11 - Server dev auto-restart (`server/package.json` dev script)
- @vitejs/plugin-react 5.1.1 - Babel-powered React Fast Refresh for Vite

## Key Dependencies

**Critical (Server):**
- `openai` 6.16.0 - OpenAI SDK used to call OpenRouter API (`server/services/chat.service.js`, `server/services/postgres.service.js`)
- `pg` 8.16.3 - PostgreSQL client (`server/repositories/postgres.repository.js`, `server/db/postgres.js`)
- `mssql` 11.0.1 - SQL Server client (`server/services/mssql.service.js`, `server/controllers/mssql.controller.js`)
- `express-session` 1.19.0 - Session management for DB connection state (`server/server.js`)
- `zod` 4.3.6 (root) - Schema validation for request bodies (all controllers)

**Security (Server):**
- `helmet` 8.1.0 - HTTP security headers middleware (`server/server.js`)
- `express-rate-limit` 8.2.1 - Rate limiting for chat (20/day) and snapshot (5/hr) endpoints (`server/middleware/rateLimiter.js`)
- `cors` 2.8.5 - CORS with allowed-origins list from env (`server/server.js`)

**Critical (Client):**
- `react-markdown` 10.1.0 - Renders AI explanation text as Markdown (`client/src/components/chat/ChatMessages.jsx`)
- `react-syntax-highlighter` 16.1.1 - SSMS-style SQL syntax highlighting in chat responses
- `react-icons` 5.5.0 - Icon set (HeroIcons hi2 subset used in `client/src/DbExplorer.jsx`)
- `reactflow` 11.11.4 - Interactive ERD visualization with layered layout (`client/src/components/SchemaVisualizer.jsx`)
- `@chakra-ui/react` 3.34.0 - UI component library for modals and theme support
- `axios` 1.13.4 - HTTP client for API calls from frontend

**Infrastructure (Server):**
- `dotenv` 17.2.3 - `.env` loading (`server/server.js`, `server/services/chat.service.js`)

## Configuration

**Environment:**
- Config lives in `server/.env` (not committed); template at `server/.env.example`
- Key vars required for full functionality:
  - `PORT` - Server port (default 8080)
  - `ALLOWED_ORIGINS` - Comma-separated CORS origins
  - `SESSION_SECRET` - Cookie signing secret (weak default exists for dev only)
  - `OPENROUTER_API_KEY` - Required for all AI features
  - `DEMO_DB_HOST`, `DEMO_DB_PORT`, `DEMO_DB_USER`, `DEMO_DB_PASSWORD`, `DEMO_DB_NAME`, `DEMO_DB_SSL`, `DEMO_DB_OPTIONS` - Optional demo DB
- Client env: `client/.env` present (contents not inspected); Vite exposes `VITE_*` vars to browser

**Build:**
- `client/vite.config.js` - Configures Vite with React plugin and dev proxy
  - Dev proxy routes `/api`, `/db`, `/health` → `http://localhost:8080`
- `client/eslint.config.js` - ESLint 9 flat config; rules for `no-unused-vars`, react-hooks, react-refresh

## Module System

- Server: ES modules (`"type": "module"` in `server/package.json`)
- Client: ES modules (`"type": "module"` in `client/package.json`); JSX via Vite/Babel

## Platform Requirements

**Development:**
- Node.js with npm
- Server runs on port 8080 by default
- Client dev server runs on port 5173 (Vite default)
- Vite proxy bridges client → server in dev (no CORS issues locally)

**Production:**
- Docker files present: `server/Dockerfile`, `client/Dockerfile`, `client/nginx.conf`, `docker-compose.yml`
- Railway integration for cloud deployment; CI pipeline auto-promotes production branch on main
- Single-instance Node.js process (pool state is in-memory, not shared across processes)
- `NODE_ENV=production` enables secure cookies (HTTPS-only)
- Static client assets built with `npm run build` in `client/`

---

*Stack analysis: 2026-03-24*
