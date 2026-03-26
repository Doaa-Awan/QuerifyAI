# Roadmap: Querify — AI Database Explorer

## Overview

Querify is deployed and demo-ready. All planned phases are complete.

## Phases

- [x] **Phase 1: Query API and Memory Safety** - Expose a clean `POST /api/query` endpoint with result caching and cap all unbounded in-memory Maps (completed 2026-03-10)

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
- [x] 01-01-PLAN.md — Create POST /api/query endpoint, cache.js (200-entry FIFO), query controller, deprecation warn on /api/chat, zod in package.json, test stubs
- [x] 01-02-PLAN.md — Cap topicCache (100 entries), conversations Map (200 entries + 20 msg/conv depth), switch ChatBot.jsx to /api/query, MEM-03 audit

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Query API and Memory Safety | 2/2 | Complete | 2026-03-10 |
