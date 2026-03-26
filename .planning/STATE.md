---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Completed 02-deployment-and-demo-ux/02-02-PLAN.md
last_updated: "2026-03-23T00:17:32.758Z"
last_activity: 2026-03-10 — Plan 01-01 complete (POST /api/query + FIFO cache)
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 3
  completed_plans: 3
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Completed 04-ensure-table-schema-files-populated-and-cleared/04-02-PLAN.md
last_updated: "2026-03-15T00:03:10.432Z"
last_activity: 2026-03-10 — Plan 01-01 complete (POST /api/query + FIFO cache)
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 0
  completed_plans: 1
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Completed 01-query-api-and-memory-safety/01-02-PLAN.md
last_updated: "2026-03-10T01:08:52.715Z"
last_activity: 2026-03-10 — Plan 01-01 complete (POST /api/query + FIFO cache)
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
  percent: 100
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Completed 01-query-api-and-memory-safety/01-01-PLAN.md
last_updated: "2026-03-10T01:00:24.554Z"
last_activity: 2026-03-09 — Roadmap created; phases derived from requirements
progress:
  [██████████] 100%
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Two-pass AI pipeline that turns a plain English question into accurate SQL using only the relevant schema slice — without exposing real user data to the LLM
**Current focus:** Phase 1 — Query API and Memory Safety

## Current Position

Phase: 1 of 2 (Query API and Memory Safety)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-26 - Completed quick task 7: fix LLM table selection to recognize faults as tickets

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 4 min
- Total execution time: ~0.07 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-query-api-and-memory-safety | 1/2 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min)
- Trend: on track

*Updated after each plan completion*
| Phase 01-query-api-and-memory-safety P02 | 2 min | 2 tasks | 5 files |
| Phase 04-ensure-table-schema-files-populated-and-cleared P01 | 15 | 3 tasks | 3 files |
| Phase 04-ensure-table-schema-files-populated-and-cleared P02 | 5 | 2 tasks | 2 files |
| Phase 02-deployment-and-demo-ux P01 | 2 | 2 tasks | 8 files |
| Phase 02-deployment-and-demo-ux P02 | 8 | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Coarse granularity → 3 phases; MEM requirements assigned to Phase 1 (must be capped before Railway deploy)
- [Roadmap]: ERD library choice is React Flow (`@xyflow/react` v12) + `@dagrejs/dagre` for layout
- [Roadmap]: Deploy last — validates Phases 1 and 2 in production; deployment is highest-risk configuration step
- [Phase 01-query-api-and-memory-safety]: Cache key: SHA-256(normalizedQuestion + sortedTables), first 16 hex chars; 'no-schema' fallback when metadata absent
- [Phase 01-query-api-and-memory-safety]: Cache invalidation at connect/connectDemo public method level, not inside testAndSetDb
- [Phase 01-query-api-and-memory-safety]: zod added explicitly to server/package.json dependencies for Railway clean install safety
- [Phase 01-query-api-and-memory-safety]: Test helpers _getConversationsSize() and _getDepth() exported on conversationRepository for unit test introspection without exposing private Map
- [Phase 01-query-api-and-memory-safety]: MEM-03 satisfied as audit comment (not runtime check) — only 2 Maps in server, both now capped; postgres.repository.js uses single dbState object
- [Phase 01-query-api-and-memory-safety]: topicCache tested via standalone fifoSet() helper to keep private Map private rather than exporting it
- [Phase 04-ensure-table-schema-files-populated-and-cleared]: table-metadata.json was already untracked; db-explorer-context.md was the only file needing git rm --cached
- [Phase 04-ensure-table-schema-files-populated-and-cleared]: writeExplorerSnapshot outer try/catch swallows all errors non-fatally; inner catch for generateTableDescriptions preserved
- [Phase 04-ensure-table-schema-files-populated-and-cleared]: writeExplorerSnapshot added to named exports for direct testability (one-word change to export line)
- [Phase 02-deployment-and-demo-ux]: sameSite set to none in production/lax in dev for cross-origin Railway+Vercel session cookies
- [Phase 02-deployment-and-demo-ux]: legacyHeaders: true on rate limiters so ChatBot.jsx reads x-ratelimit-remaining
- [Phase 02-deployment-and-demo-ux]: railway.toml rootDirectory must be configured in Railway dashboard to point to server/
- [Phase 02-deployment-and-demo-ux]: CSS variables adapted to project token names (--surface, --line, --muted, --accent) rather than --color-* names from plan spec
- [Phase 02-deployment-and-demo-ux]: ChatInput disabled prop applied to both textarea and submit button for complete blocked-state input prevention

### Roadmap Evolution

- Phase 4 added: Ensure table schema files populated and cleared
- Phase 4 added: Implement SQL Server DB Connection Option

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | fix auto-connect to demo DB on load/refresh | 2026-03-23 | c79294f | [1-fix-auto-connect-to-demo-db-on-load-refr](./quick/1-fix-auto-connect-to-demo-db-on-load-refr/) |
| 3 | fix ci-cd testing before main branch is pushed to production | 2026-03-23 | c6b0b9f | [3-fix-ci-cd-testing-before-main-branch-is-](./quick/3-fix-ci-cd-testing-before-main-branch-is-/) |
| 5 | update QUERIFY_SPEC.md to reflect all implemented features | 2026-03-24 | 172f18f | [5-update-querify-spec-md-to-reflect-all-im](./quick/5-update-querify-spec-md-to-reflect-all-im/) |
| 6 | add per-response metadata line (tables cached, PII masked, token count) | 2026-03-26 | 30e3ae1 | [6-add-information-for-user-about-tables-ca](./quick/6-add-information-for-user-about-tables-ca/) |
| 7 | fix LLM table selection to recognize faults as tickets | 2026-03-26 | c32623f | [7-fix-llm-table-selection-to-recognize-fau](./quick/7-fix-llm-table-selection-to-recognize-fau/) |

### Blockers/Concerns

- [Phase 3]: Railway health check probe path and `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` validity — verify against current Railway docs before implementation
- [Phase 3]: Neon SSL connection string format — confirm whether `?sslmode=require` is needed or existing SSL config suffices
- [Phase 2]: Verify `@xyflow/react` v12 peer dep with React 19 — run `npm ls react` after install

## Session Continuity

Last session: 2026-03-26T18:40:42Z
Stopped at: Completed quick task 6: add per-response metadata line (tables cached, PII masked, token count)
Resume file: None
