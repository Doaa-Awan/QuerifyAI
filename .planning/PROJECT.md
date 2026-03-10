# Querify — AI Database Explorer

## What This Is

Querify is a privacy-first database schema exploration and SQL generation tool for developers navigating databases they didn't build. It connects to a PostgreSQL database, automatically maps the entire schema with AI-generated table descriptions, renders an interactive ERD, and accepts natural language questions to return accurate SQL — without sending sensitive data to the LLM.

Positioned as: *"The fastest way to understand a database you didn't build."*

## Core Value

The two-pass AI pipeline that turns a plain English question into accurate SQL using only the relevant slice of the schema — without ever exposing real user data to the LLM.

## Requirements

### Validated

- ✓ Schema introspection engine (`introspection.js`) — connects, maps tables/columns/FKs/row counts at connect time
- ✓ Privacy-first sanitization layer — PII columns detected by name pattern, values scrambled before any AI call
- ✓ AI table description generation — one-sentence plain-English description per table via OpenRouter
- ✓ In-memory schema store (`schemaStore.js`) — singleton, populated on connect, powers `GET /api/schema`
- ✓ Two-pass AI query pipeline (`chat.service.js`) — Pass 1 selects relevant tables, Pass 2 generates SQL with focused context
- ✓ Per-conversation topic cache with table merging — follow-up detection reuses cached table set
- ✓ `POST /api/connect` — connect + introspect + AI descriptions in one call
- ✓ `GET /api/schema` — structured `TableSchema[]` + `relationships[]` for ERD
- ✓ Rate-limited AI proxy — API key server-side only, 20 req/day on demo instance
- ✓ Frontend localStorage persistence — schema, messages, conversationId survive refresh
- ✓ Basic ERD visualization — custom SVG with BFS layout, FK edges, zoom/pan/drag
- ✓ Docker config — server and client Dockerfiles + docker-compose
- ✓ CORS via env (`ALLOWED_ORIGINS`), Vite proxy for dev

### Active

- [ ] `POST /api/query` endpoint — dedicated query endpoint separate from `/api/chat`, clean request/response shape
- [ ] `cache.js` — query result caching to avoid redundant AI calls for identical questions
- [ ] Polished ERD — React Flow or D3 based, replacing the custom SVG; must be demo-quality (zoomable, pannable, node cards with columns)
- [ ] Rate limit banner — visible in-app warning: "Demo limited to 20 queries/day — clone repo to use your own key"
- [ ] Cold start loading state — Railway spins down; frontend shows "Waking up the server (~15s)" on first load
- [ ] Vercel + Railway deployment config — environment variables, build settings, CORS, sample Neon DB wired up

### Out of Scope

- Full frontend rebrand (ConnectionForm, SchemaExplorer, QueryInterface, SQLDisplay components) — current UI is sufficient for demo; rebrand is a future milestone
- Multi-database support (MySQL, SQL Server) — PostgreSQL only in v1
- Live query execution — Querify generates SQL, user runs it themselves; not a BI tool
- Auth / multi-user / paid plans — single-user demo tool, not a SaaS product this milestone
- Composite PK support — first PK column used; edge case, defer

## Context

The backend core is built and working. The current UI is a functional prototype (ChatBot, ChatMessages, DbExplorer, ERDModal with custom SVG) that demonstrates the AI pipeline. Two sessions of work have already implemented streaming, SQL syntax highlighting, query history, and Docker config.

The gap is:
1. The query API endpoint is `/api/chat` (monolithic) rather than a clean `/api/query` — needs to be separated
2. The ERD is a custom SVG that works but isn't polished enough for a portfolio demo
3. There's no deployment-facing UX (rate limit banner, cold start state)
4. Deployment hasn't been wired end-to-end (Vercel + Railway + Neon sample DB)

The QUERIFY_SPEC.md in the repo root is the canonical product spec.

## Constraints

- **Tech stack**: React 19, Vite 7, Node.js ES modules, Express 5 — no TypeScript, no Tailwind
- **AI provider**: OpenRouter (gpt-4o-mini) — keep existing client and rate limiter
- **ERD library**: React Flow preferred (or D3) — avoid adding heavy dependencies beyond one well-maintained lib
- **No real data to LLM**: sanitization layer must remain intact through any refactor
- **Single-process demo**: in-memory stores are acceptable; no Redis/DB persistence required this milestone
- **Deployment targets**: Vercel (frontend static), Railway (backend Node), Neon (sample PostgreSQL DB)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two-pass AI pipeline (table select → SQL gen) | Reduces token usage on large schemas; improves accuracy by scoping context | ✓ Good — working in production |
| OpenRouter over direct OpenAI | API key abstraction, model flexibility | — Pending evaluation |
| In-memory schema store (not DB) | Demo tool; no persistence requirement | — Pending (acceptable for v1) |
| Custom SVG ERD → React Flow/D3 | Custom SVG lacks polish for demo; library gives better interaction | — Pending |
| `/api/query` separate from `/api/chat` | Cleaner API contract; chat is legacy, query is the real interface | — Pending |

---
*Last updated: 2026-03-09 after initialization*
