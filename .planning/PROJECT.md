# Querify — AI Database Explorer

## What This Is

Querify is a privacy-first database exploration and SQL generation tool for developers navigating databases they didn't build. It connects to PostgreSQL or SQL Server, maps the entire schema with AI-generated table descriptions, renders an interactive ReactFlow ERD, and accepts natural language questions to return accurate SQL and explanation — without sending sensitive data to the LLM. Deployed at Vercel (frontend) + Railway (backend).

Positioned as: *"The fastest way to understand a database you didn't build."*

## Core Value

The two-pass AI pipeline that turns a plain English question into accurate SQL using only the relevant slice of the schema — without ever exposing real user data to the LLM.

## Requirements

### Validated

- ✓ Schema introspection engine — connects, maps tables/columns/FKs/row counts at connect time — v1.0
- ✓ Privacy-first sanitization layer — PII columns detected by name pattern, values scrambled before any AI call — v1.0
- ✓ AI table description generation — one-sentence plain-English description per table via OpenRouter — v1.0
- ✓ In-memory schema store — singleton, populated on connect, powers `GET /api/schema` — v1.0
- ✓ Two-pass AI query pipeline — Pass 1 selects relevant tables, Pass 2 generates SQL with focused context — v1.0
- ✓ Per-conversation topic cache with table merging — follow-up detection reuses cached table set — v1.0
- ✓ `POST /api/connect` — connect + introspect + AI descriptions in one call — v1.0
- ✓ `GET /api/schema` — structured `TableSchema[]` + `relationships[]` for ERD — v1.0
- ✓ Rate-limited AI proxy — API key server-side only, 20 req/day on demo instance — v1.0
- ✓ Frontend localStorage persistence — schema, messages, conversationId survive refresh — v1.0
- ✓ Docker config — server and client Dockerfiles + docker-compose — v1.0
- ✓ CORS via env (`ALLOWED_ORIGINS`), Vite proxy for dev — v1.0
- ✓ `POST /api/query` endpoint — clean request/response shape `{question, conversationId}` → `{sql, explanation, tablesUsed}` — v1.0
- ✓ `cache.js` — 200-entry FIFO SHA-256 query result cache, invalidated on DB connect — v1.0
- ✓ ReactFlow ERD — interactive node cards with FK edges, layered layout, description tooltips — v1.0
- ✓ Rate limit banner — three-state (info/warning/blocked) with chat input lockout at zero — v1.0
- ✓ Cold start banner — Railway spin-down handler with exponential backoff and 3-state UI — v1.0
- ✓ Vercel + Railway deployment config — session cookie hardening, health endpoint, deploy configs — v1.0
- ✓ `topicCache` capped at 100 entries (FIFO eviction) — v1.0
- ✓ `conversations` Map capped at 200 entries / 20 messages per conversation — v1.0
- ✓ SQL Server connection support — separate controller/service/repository alongside PostgreSQL — v1.0
- ✓ GitHub Actions CI/CD — test + lint on PR, auto-promote production branch on main pass — v1.0
- ✓ Per-response metadata line — tables cached, PII columns masked, token count — v1.0
- ✓ Jest integration tests for chat accuracy and token metrics — v1.0
- ✓ Session flag (`req.session.connected`) set reliably on all connect handlers (Postgres + MSSQL) — v1.1
- ✓ `connectLimiter` (10 req / 15 min) applied to all 5 connect routes — v1.1
- ✓ SSL `rejectUnauthorized` configurable via env var, secure-by-default — v1.1
- ✓ Weak `SESSION_SECRET` startup guard (stderr warning in production) — v1.1
- ✓ PII masking hardened: SSN, DOB, passport columns masked regardless of storage type — v1.1
- ✓ JSON parse failure handling in `generateTableDescriptions` (returns `{}`) — v1.1
- ✓ 91 unit + integration tests: all PII patterns, `buildDummyValue` branches, `sanitizeSamples`, `requireSession`, `connectLimiter` — v1.1

### Active

<!-- v1.2 — to be defined with /gsd:new-milestone -->

- [ ] AUTH-03: `requireSession` middleware wired to `/api/chat`, `/api/query`, `/db/schema`, and snapshot endpoints
- [ ] OBS-01: Rate limit banner shows time-until-reset to the user
- [ ] OBS-02: Dead code (`apiFetch` in `client/src/api.js`) removed

### Out of Scope

- Full frontend rebrand (ConnectionForm, SchemaExplorer, QueryInterface, SQLDisplay components) — current UI is sufficient for demo
- Live query execution — Querify generates SQL, user runs it themselves; not a BI tool
- Auth / multi-user / paid plans — single-user demo tool
- Composite PK support — first PK column used; edge case, defer
- Supabase demo DB pre-wired (DEPL-06) — manual Railway env var action still needed
- `@xyflow/react v12` / dagre / MiniMap — reactflow@11 with custom layout is sufficient

## Context

v1.1 shipped. Security posture hardened: connect endpoints rate-limited, SSL configurable, SESSION_SECRET guard added, PII masking layer closed for SSN/DOB/passport, 91 new tests. Server LOC: ~3,650 JS. Full test suite: 135 tests passing.

**Tech stack:** React 19, Vite 7, Node.js ES modules, Express 5, ReactFlow 11, OpenRouter (gpt-4o-mini), PostgreSQL (pg), SQL Server (mssql), Railway (backend), Vercel (frontend)

**Known open items:**
- `requireSession` middleware implemented and tested (AUTH-03) but not yet wired to production routes — deferred to v1.2
- `apiFetch` in `client/src/api.js` is dead code (OBS-02, deferred)
- `RateLimitBanner` blocked state doesn't forward time-until-reset (OBS-01, deferred)

## Constraints

- **Tech stack**: React 19, Vite 7, Node.js ES modules, Express 5 — no TypeScript, no Tailwind
- **AI provider**: OpenRouter (gpt-4o-mini) — keep existing client and rate limiter
- **No real data to LLM**: sanitization layer must remain intact through any refactor
- **Single-process demo**: in-memory stores are acceptable; no Redis/DB persistence required
- **Deployment targets**: Vercel (frontend static), Railway (backend Node)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two-pass AI pipeline (table select → SQL gen) | Reduces token usage on large schemas; improves accuracy by scoping context | ✓ Good — working in production |
| OpenRouter over direct OpenAI | API key abstraction, model flexibility | ✓ Good — no issues in production |
| In-memory schema store (not DB) | Demo tool; no persistence requirement | ✓ Acceptable for v1 demo scale |
| `reactflow@11` instead of `@xyflow/react v12` | React 19 peer dep compatibility unknown at time; existing install was reactflow@11 | ✓ Good — works, minor spec deviation |
| Custom layered layout instead of dagre | Avoids extra dependency; custom algo sufficient for demo scale | ✓ Good — functional |
| `/api/query` separate from `/api/chat` | Cleaner API contract; chat is legacy, query is the real interface | ✓ Good — clean separation achieved |
| SHA-256 cache key (table names + question) | Stable fingerprint; column-level changes don't bust cache (acceptable tradeoff) | ✓ Acceptable — documented in audit |
| `sameSite:'none'` in production via NODE_ENV guard | Required for cross-origin Railway+Vercel session cookies | ✓ Good — necessary for prod |
| `legacyHeaders: true` on rate limiters | ChatBot.jsx reads `x-ratelimit-remaining` (legacy format) | ✓ Good — works end-to-end |
| SQL Server added via quick task (not formal phase) | Low-risk connection pattern mirrors PostgreSQL; no need for full phase overhead | ✓ Good — ships with v1.0 |
| MEM-03 as audit comment (not runtime check) | Only 2 Maps in server, both capped; postgres.repository.js uses single object | ✓ Acceptable — documented |
| Session flag at controller layer (not service) | Flag always tied to HTTP response path, regardless of service internals | ✓ Good — v1.1 |
| `rejectUnauthorized` defaults to `true`; opt-out via exact string `'false'` | Prevents accidental SSL downgrade from typos or missing env var | ✓ Good — v1.1 |
| `console.error` (not `throw`) for weak SESSION_SECRET guard | Stderr visibility without crashing live production deployment | ✓ Good — v1.1 |
| PII name check before `isDateType` guard in `isLikelyPiiColumn` | PII-named date columns (dob, birth_date) must be masked regardless of storage type | ✓ Good — v1.1 |
| Isolated `rateLimit` instance in connectLimiter tests | Avoids shared MemoryStore state between tests and production middleware | ✓ Good — v1.1 |
| `before()` (not `beforeEach`) for connectLimiter test state | 10-call state must carry into 429 assertion; reset between cases would break the test | ✓ Good — v1.1 |

---
*Last updated: 2026-03-30 after v1.1 milestone completion*
