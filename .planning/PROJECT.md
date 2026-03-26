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

### Active

*(none — planning next milestone)*

### Out of Scope

- Full frontend rebrand (ConnectionForm, SchemaExplorer, QueryInterface, SQLDisplay components) — current UI is sufficient for demo
- Live query execution — Querify generates SQL, user runs it themselves; not a BI tool
- Auth / multi-user / paid plans — single-user demo tool
- Composite PK support — first PK column used; edge case, defer
- Supabase demo DB pre-wired (DEPL-06) — manual Railway env var action still needed
- `@xyflow/react v12` / dagre / MiniMap — reactflow@11 with custom layout is sufficient

## Context

v1.0 shipped. The app is live on Vercel + Railway with PostgreSQL and SQL Server support. 17 days of development, 76 files changed, ~9,600 lines of JS/JSX. The AI pipeline, ERD, deployment stack, and demo UX are all production-ready.

**Tech stack:** React 19, Vite 7, Node.js ES modules, Express 5, ReactFlow 11, OpenRouter (gpt-4o-mini), PostgreSQL (pg), SQL Server (mssql), Railway (backend), Vercel (frontend)

**Known open items:**
- `apiFetch` in api.js is dead code
- RateLimitBanner blocked state doesn't show time-until-reset (available in DbExplorer state, not forwarded)

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

---
*Last updated: 2026-03-26 after v1.0 milestone*
