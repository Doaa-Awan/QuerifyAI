# Roadmap: Querify — AI Database Explorer

## Overview

Querify is deployed and demo-ready. Remaining work covers two follow-on phases: harden the snapshot file lifecycle so runtime-only files never appear in git (Phase 2), then add SQL Server connection support alongside existing PostgreSQL (Phase 3). Each phase is independently verifiable and unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Query API and Memory Safety** - Expose a clean `POST /api/query` endpoint with result caching and cap all unbounded in-memory Maps (completed 2026-03-10)
- [ ] **Phase 2: Ensure table schema files populated and cleared** - Snapshot file lifecycle is explicit, safe, and tested
- [ ] **Phase 3: Implement SQL Server DB Connection Option** - Add SQL Server support alongside existing PostgreSQL

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

### Phase 2: Ensure table schema files populated and cleared

**Goal:** Snapshot file lifecycle is explicit, safe, and tested — runtime-only files never appear in git, server startup never fails due to cleanup errors, and a DB or disk failure during snapshot generation is swallowed non-fatally
**Requirements**: TBD
**Depends on:** Phase 1
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 2 to break down)

### Phase 3: Implement SQL Server DB Connection Option

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 2
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 3 to break down)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Query API and Memory Safety | 2/2 | Complete   | 2026-03-10 |
| 2. Ensure table schema files   | 0/0 | Not Started|  |
| 3. Implement SQL Server        | 0/0 | Not Started|  |
