# Codebase Structure

**Analysis Date:** 2026-03-09

## Directory Layout

```
ai-db-explorer-2026/
├── client/                     # React frontend (Vite)
│   ├── public/                 # Static assets (SVG icons)
│   ├── src/
│   │   ├── assets/             # Bundled static assets
│   │   ├── components/
│   │   │   ├── chat/           # Chat UI components
│   │   │   │   ├── ChatBot.jsx         # Chat state + API calls to /api/query
│   │   │   │   ├── ChatInput.jsx       # Message input form
│   │   │   │   ├── ChatMessages.jsx    # Message list + CopyPre renderer
│   │   │   │   ├── TypingIndicator.tsx # Bot typing animation
│   │   │   │   └── ssmsTheme.js        # Custom SQL syntax highlight theme
│   │   │   └── ui/             # (Reserved for shared UI primitives)
│   │   ├── App.jsx             # Root component: routes between Login and DbExplorer
│   │   ├── App.css             # All application styles (dark theme, CSS variables)
│   │   ├── Login.jsx           # DB connection form (PostgreSQL + SQL Server tabs, demo buttons)
│   │   ├── DbExplorer.jsx      # Explorer layout: SchemaSidebar + chat + SchemaVisualizer
│   │   ├── SchemaSidebar.jsx   # Collapsible table/column list with hover tooltips
│   │   ├── SchemaVisualizer.jsx # ReactFlow ERD with layered layout + FK edges
│   │   ├── RateLimitBanner.jsx # Context-aware info/warning/blocked rate limit banner
│   │   ├── ColdStartBanner.jsx # Railway cold start delay notice
│   │   ├── index.css           # CSS reset / base styles
│   │   └── main.jsx            # React DOM entry point
│   ├── dist/                   # Built output (committed, nginx-served in Docker)
│   ├── Dockerfile              # Client Docker image (nginx)
│   ├── nginx.conf              # nginx config for SPA serving
│   ├── index.html              # Vite HTML entry
│   ├── vite.config.js          # Vite config with /api + /db proxy to backend
│   └── package.json
│
├── server/                     # Node.js Express backend
│   ├── controllers/
│   │   ├── chat.controller.js      # Legacy POST /api/chat SSE handler
│   │   ├── query.controller.js     # POST /api/query — main NL→SQL endpoint
│   │   ├── postgres.controller.js  # All /db/* PostgreSQL handlers
│   │   └── mssql.controller.js     # All /db/*-sqlserver handlers
│   ├── services/
│   │   ├── chat.service.js         # Two-pass AI pipeline, topic cache
│   │   ├── postgres.service.js     # PostgreSQL connect, snapshot, PII sanitization
│   │   ├── mssql.service.js        # SQL Server connect, snapshot, introspection
│   │   ├── introspection.js        # Structured schema introspection -> table objects
│   │   ├── cache.js                # In-memory query result cache (question+dialect+tables key)
│   │   └── schemaStore.js          # In-memory schema singleton
│   ├── repositories/
│   │   ├── postgres.repository.js  # Pool state singleton
│   │   └── conversation.repository.js # Per-conversation message history Map
│   ├── db/
│   │   └── postgres.js             # Raw pg queries: getSchema, getTables, getSampleRows, getRowCounts
│   ├── middleware/
│   │   ├── rateLimiter.js          # chatLimiter + snapshotLimiter + connectLimiter
│   │   └── requireSession.js       # Session auth guard
│   ├── prompts/
│   │   ├── chatbot.txt             # System prompt template with {{dbSchema}} placeholder
│   │   ├── db-explorer-context.md  # Auto-generated: schema + sample rows as markdown
│   │   └── table-metadata.json     # Auto-generated: per-table descriptions + column metadata
│   ├── routes.js               # All Express route definitions (PostgreSQL + SQL Server)
│   ├── Dockerfile              # Server Docker image (Node.js)
│   ├── server.js               # Express app setup + listen
│   └── package.json
│
├── .github/
│   └── workflows/              # GitHub Actions CI (auto-promotes production on main)
├── .planning/
│   └── codebase/               # GSD mapping documents
├── docker-compose.yml          # Multi-service Docker Compose (client + server)
├── package.json                # Root package (no deps; workspace scripts only)
├── QUERIFY_SPEC.md             # Product spec / design reference
└── README.md
```

## Directory Purposes

**`server/controllers/`:**
- Purpose: HTTP boundary — parse + validate requests, call services, send responses
- Contains: Zod schema definitions, handler functions exported as named objects
- Key files: `server/controllers/chat.controller.js`, `server/controllers/postgres.controller.js`

**`server/services/`:**
- Purpose: All application logic; AI orchestration, DB operations, file writes
- Contains: Business logic functions, OpenAI client instantiation, snapshot generation
- Key files: `server/services/chat.service.js` (AI), `server/services/postgres.service.js` (DB + snapshots), `server/services/introspection.js`, `server/services/schemaStore.js`

**`server/repositories/`:**
- Purpose: In-memory data stores accessed via a consistent interface
- Contains: Module-level state variables wrapped in exported objects
- Key files: `server/repositories/postgres.repository.js` (pg Pool), `server/repositories/conversation.repository.js` (chat history)

**`server/db/`:**
- Purpose: Raw database queries only; no business logic
- Contains: Pure async functions that accept a pool and return rows
- Key files: `server/db/postgres.js`

**`server/middleware/`:**
- Purpose: Express middleware applied per-route
- Contains: Rate limiters, session guard
- Key files: `server/middleware/rateLimiter.js`, `server/middleware/requireSession.js`

**`server/prompts/`:**
- Purpose: AI prompt assets; both static templates and runtime-generated context files
- Contains: `chatbot.txt` (static system prompt), `db-explorer-context.md` (generated on connect), `table-metadata.json` (generated on connect)
- Note: `db-explorer-context.md` and `table-metadata.json` are written at runtime by `server/services/postgres.service.js`; ephemeral during a server session

**`client/src/components/chat/`:**
- Purpose: All chat UI components
- Contains: State management (`ChatBot.jsx`), rendering (`ChatMessages.jsx`), input (`ChatInput.jsx`), animation (`TypingIndicator.tsx`), theming (`ssmsTheme.js`)

**`client/src/components/ui/`:**
- Purpose: Shared presentational primitives (currently empty; reserved)

**`client/dist/`:**
- Purpose: Vite production build output served by nginx in Docker
- Generated: Yes (by `npm run build`)
- Committed: Yes (to enable Docker deployment without a build step)

## Key File Locations

**Entry Points:**
- `server/server.js`: Express app bootstrap and HTTP listener
- `client/src/main.jsx`: React DOM mount
- `client/index.html`: Vite HTML template

**Configuration:**
- `server/.env`: Server environment variables (not committed)
- `server/.env.example`: Documented env var template
- `client/vite.config.js`: Vite dev server config with backend proxy
- `server/package.json`: Server dependencies and npm scripts
- `client/package.json`: Client dependencies and npm scripts

**Core Logic:**
- `server/services/chat.service.js`: Two-pass AI pipeline — the most complex file in the codebase
- `server/services/postgres.service.js`: PostgreSQL connection, PII sanitization, snapshot generation
- `server/services/mssql.service.js`: SQL Server connection, introspection, snapshot generation
- `server/controllers/query.controller.js`: Main `/api/query` handler with cache + chatService delegation
- `server/services/cache.js`: In-memory query result cache
- `server/routes.js`: All API route definitions (PostgreSQL + SQL Server)
- `client/src/Login.jsx`: DB connection form (PostgreSQL + SQL Server tabs)
- `client/src/DbExplorer.jsx`: Explorer layout shell
- `client/src/SchemaVisualizer.jsx`: ReactFlow ERD diagram

**Prompt Templates:**
- `server/prompts/chatbot.txt`: System prompt; `{{dbSchema}}` replaced at runtime
- `server/prompts/db-explorer-context.md`: Generated schema + samples (created by `buildExplorerSnapshot`)
- `server/prompts/table-metadata.json`: Generated table descriptions + column details (created by `writeTableMetadata`)

**Styling:**
- `client/src/App.css`: All component styles in a single file using CSS custom properties (dark theme)
- `client/src/index.css`: Base reset only

## Naming Conventions

**Files:**
- Backend: `[domain].[layer].js` — e.g., `chat.controller.js`, `postgres.service.js`, `postgres.repository.js`
- Frontend components: PascalCase `.jsx` — e.g., `ChatBot.jsx`, `DbExplorer.jsx`, `ERDModal.jsx`
- One exception: `TypingIndicator.tsx` uses `.tsx` extension; project is otherwise plain JS
- Utility/config: camelCase `.js` — e.g., `ssmsTheme.js`, `schemaStore.js`

**Directories:**
- Backend: lowercase singular nouns — `controllers/`, `services/`, `repositories/`, `middleware/`, `db/`, `prompts/`
- Frontend: lowercase for directories — `components/`, `chat/`, `ui/`, `assets/`

**Exports:**
- Backend modules export a named object: `export const chatService = { ... }`, `export const postgresController = { ... }`
- Frontend components use default export: `export default function DbExplorer`

## Where to Add New Code

**New API endpoint:**
1. Add handler method to existing controller in `server/controllers/` or create `server/controllers/[domain].controller.js`
2. Add service method in `server/services/[domain].service.js`
3. Register route in `server/routes.js`
4. Add Zod input schema in the controller

**New React view or major UI section:**
- Top-level views: `client/src/[ViewName].jsx` (alongside `App.jsx`, `DbExplorer.jsx`)
- Shared components: `client/src/components/[ComponentName].jsx`
- Chat-specific components: `client/src/components/chat/[ComponentName].jsx`
- Shared UI primitives (buttons, inputs): `client/src/components/ui/[ComponentName].jsx`

**New DB query:**
- Add a function to `server/db/postgres.js` accepting `(pool, ...args)`
- Import and call from a service, not directly from a controller

**New middleware:**
- Create `server/middleware/[name].js`, export a function
- Import and apply per-route in `server/routes.js`

**New AI prompt logic:**
- System prompt text: edit `server/prompts/chatbot.txt`
- Prompt construction: modify `buildInstructions()` in `server/services/chat.service.js`
- New generated context files: add write logic in `server/services/postgres.service.js`

**Styles:**
- All styles go in `client/src/App.css`; use existing CSS custom properties (`--accent`, `--bg`, etc.) defined in the `:root` block at the top of that file

## Special Directories

**`server/prompts/`:**
- Purpose: AI prompt templates and runtime-generated DB context
- `chatbot.txt` is static and version-controlled
- `db-explorer-context.md` and `table-metadata.json` are generated at runtime on connect; treat as ephemeral cache

**`.planning/codebase/`:**
- Purpose: GSD architecture and convention documents for planning and execution
- Generated: By GSD map-codebase command
- Committed: Yes

**`client/dist/`:**
- Purpose: Production build output served by nginx in Docker
- Generated: By `npm run build`
- Committed: Yes (to enable Docker deployment without a build step)

---

*Structure analysis: 2026-03-24*
