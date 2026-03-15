# Roadmap: Querify — AI Database Explorer

## Overview

Querify's backend core and prototype UI are working. This milestone transforms it into a demo-ready portfolio piece across two remaining phases: clean up the query API and cap unbounded in-memory structures (Phase 1, complete), then wire the full deployment stack on Vercel + Railway with production-facing UX for cold start and rate limiting (Phase 2). Each phase is independently verifiable and unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Query API and Memory Safety** - Expose a clean `POST /api/query` endpoint with result caching and cap all unbounded in-memory Maps (completed 2002-03-10)
- [ ] **Phase 2: Deployment and Demo UX** - Deploy to Vercel + Railway with Neon demo DB, cold start banner, and rate limit indicator

## Phase Details

### Phase 1: Query API and Memory Safety
**Goal**: Users get SQL answers through a clean, cacheable API endpoint and the backend is safe to deploy without OOM risk
**Depends on**: Nothing (first phase)
**Requirements**: QAPI-01, QAPI-02, QAPI-03, QAPI-04, MEM-01, MEM-02, MEM-03
**Success Criteria** (what must be TRUE):
  1. A caller can POST `{ question, conversationId }` to `/api/query` and receive `{ sql, explanation, tablesUsed }` as a JSON response
  2. Asking the same question twice returns the second answer instantly (cache hit) without a new AI call
  3. The old `/api/chat` endpoint still works but logs a deprecation warning in the server console
  4. The server can handle 200+ distinct questions and 100+ conversation threads without memory growing unboundedly
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Create POST /api/query endpoint, cache.js (200-entry FIFO), query controller, deprecation warn on /api/chat, zod in package.json, test stubs
- [ ] 01-02-PLAN.md — Cap topicCache (100 entries), conversations Map (200 entries + 20 msg/conv depth), switch ChatBot.jsx to /api/query, MEM-03 audit

### Phase 2: Deployment and Demo UX
**Goal**: Querify is live at a public URL with a Neon sample DB pre-wired and deployment-context UX that prevents user confusion
**Depends on**: Phase 1
**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04, DEPL-05, DEPL-06, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. Visiting the public Vercel URL loads the app, connects to the Neon demo DB, and a user can ask a question and receive SQL — all without touching local dev
  2. When the Railway server is cold (first visit after inactivity), the app shows "Waking up the server..." within 3 seconds and resolves silently when ready
  3. The chat interface shows a rate limit banner that reflects the user's remaining query budget and transitions to a persistent blocked state at zero
  4. Refreshing the Vercel app on any route does not return a 404
**Plans**: TBD

Plans:
- [ ] 02-01: Pre-deploy hardening — session cookie `sameSite/secure`, `VITE_API_URL` abstraction in `api.js`, `vercel.json` SPA rewrite, `railway.toml` config, `GET /health` endpoint
- [ ] 02-02: Cold start handler component (exponential backoff health polling) and rate limit banner component (three-state: info/warning/blocked)
- [ ] 02-03: End-to-end deployment — set all Railway and Vercel env vars, wire existing Supabase demo DB credentials, smoke test live URL

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Query API and Memory Safety | 2/2 | Complete   | 2002-03-10 |
| 2. Deployment and Demo UX | 0/3 | Not started | - |

### Phase 3: Ensure table schema files populated and cleared

**Goal:** Snapshot file lifecycle is explicit, safe, and tested — runtime-only files never appear in git, server startup never fails due to cleanup errors, and a DB or disk failure during snapshot generation is swallowed non-fatally
**Requirements**: TBD
**Depends on:** Phase 2
**Plans:** 2/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Remove snapshot files from git index, fix startup catch to emit console.warn, wrap writeExplorerSnapshot in outer non-fatal try/catch
- [ ] 02-02-PLAN.md — Write unit tests for clearExplorerSnapshotFile and writeExplorerSnapshot using node:test with mocked fs
