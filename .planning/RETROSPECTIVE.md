# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — Portfolio MVP

**Shipped:** 2026-03-26
**Phases:** 2 formal | **Plans:** 3 formal + 8 quick tasks | **Duration:** 17 days

### What Was Built
- Clean `POST /api/query` API with 200-entry FIFO cache and memory safety caps on all in-memory Maps
- Vercel + Railway deployment stack with cross-origin session cookies, health endpoint, and deploy configs
- Cold start banner (exponential backoff /health polling) and three-state rate limit banner with chat input lockout
- ReactFlow ERD visualizer with FK edges, layered auto-layout, description tooltips, FK hover highlighting
- SQL Server connection support alongside PostgreSQL (separate controller/service/repository)
- GitHub Actions CI/CD pipeline auto-promoting production branch on main pass
- Per-response metadata line (tables cached, PII columns masked, token counts)
- Jest integration tests for chat accuracy and token metrics

### What Worked
- **Quick tasks for low-scope work** — the 8 quick tasks were the right vehicle for fixes and small features that didn't warrant full phase overhead; kept formal phases clean
- **SUMMARY.md as execution records** — detailed frontmatter (provides, decisions, deviations) made the audit straightforward even without VERIFICATION.md
- **Incremental deployment hardening** — doing deploy config before UX components (02-01 before 02-02) meant the health endpoint existed when ColdStartBanner needed it
- **Keeping SQL Server as a quick task** — mirroring the PostgreSQL pattern made it low-risk; no need for a full phase

### What Was Inefficient
- **ERD built outside formal phases** — SchemaVisualizer.jsx was implemented without a GSD phase, so requirements (ERD-01 through ERD-06) were never updated in REQUIREMENTS.md; the audit had to piece together evidence from quick task summaries
- **No VERIFICATION.md files** — both formal phases skipped Nyquist validation; this created documentation gaps that the milestone audit had to work around
- **REQUIREMENTS.md traceability table was stale** — ERD was assigned to a "Phase 2 ERD" that was replaced by Deployment; the table still referenced the old plan structure; required manual cleanup at audit time
- **02-03 plan was never executed** — DEPL-06 (Supabase demo DB env vars) was written as a plan but never run; the plan should have either been executed or converted to a quick task

### Patterns Established
- Quick tasks (`/gsd:quick`) are the right tool for: bug fixes, CI/CD tweaks, doc updates, and small features that mirror existing patterns
- Deploy config should go in its own plan before any UX that depends on deployed infrastructure
- When building features outside formal GSD phases, update REQUIREMENTS.md checkboxes immediately to avoid audit gaps

### Key Lessons
1. **Spec deviations must be documented at implementation time** — ERD was built with reactflow@11/custom layout instead of @xyflow/react v12/dagre; this only surfaced at audit. The right place to record "we're deviating from spec X because Y" is the quick task SUMMARY, not the milestone audit.
2. **DEPL-06-style requirements** (set env vars in dashboard) should be tracked as manual checklist items, not plan tasks — they can't be verified from code and don't belong in GSD execution flow.
3. **Archiving phases before completing the milestone** caused gsd-tools to lose count of phases/plans — run `milestone complete` before `cleanup` next time, or accept that stats need manual correction.

### Cost Observations
- Model mix: 100% sonnet (claude-sonnet-4-6)
- Notable: Quick tasks averaged 2-8 min; formal phases 2-8 min; audit was the heaviest context operation

---

## Milestone: v1.1 — Security Hardening

**Shipped:** 2026-03-30
**Phases:** 3 (phases 3–5) | **Plans:** 7 | **Duration:** ~13 days (2026-03-14 → 2026-03-27)

### What Was Built
- Session flag set on all 5 connect handlers (Postgres + MSSQL) — infrastructure for future auth enforcement
- `connectLimiter` middleware (10 req / 15 min) on all 5 connect routes
- SSL `rejectUnauthorized` opt-out via env var; weak `SESSION_SECRET` production guard
- PII masking hardened: SSN, DOB, passport gaps closed; JSON parse failure guard added
- 91 new unit + integration tests covering all critical PII and middleware paths; full suite 135/135

### What Worked
- **Nyquist validation on every phase** — all 3 phases got VALIDATION.md with `nyquist_compliant: true`; the formal test coverage contract kept the work honest
- **Short focused plans** — avg ~2 min per plan execution; Plans 03-01, 04-01/02/03, 05-01/02/03 each had exactly the right scope; no plan needed a second pass
- **Auto-TDD approach for Plan 05-01** — exporting `isLikelyPiiColumn` and `buildDummyValue` as named exports to support Plan 05-02 was decided up-front in the PLAN.md, saving a rework cycle
- **Isolated rateLimit instance in tests** — avoiding shared MemoryStore state between test runs was the right call; tests are 100% deterministic

### What Was Inefficient
- **Milestone audit was stale on Nyquist** — the initial audit (2026-03-27) was run before VALIDATION.md files existed; re-audit was needed on 2026-03-29. Running `/gsd:validate-phase` before `/gsd:audit-milestone` avoids this
- **SUMMARY frontmatter inconsistency** — SEC-01, TEST-04, TEST-05 ended up in `dependency_graph.provides` instead of `requirements-completed`; this created ambiguity in the 3-source cross-reference. Simple fix: always write `requirements-completed` in SUMMARY frontmatter
- **Route path documentation mismatch** — actual routes (`/api/connect`, `/db/connect-sqlserver`) don't match milestone docs; discovered at re-audit. Route table in ROADMAP should be verified against routes.js during phase planning

### Patterns Established
- **PII guard order**: primary-key check → PII name check → date-type suppression → value heuristics. Never let type guards run before name-pattern checks on sensitive fields
- **Secure-by-default env toggle**: `process.env.VAR !== 'false'` so absent/empty/typo values stay secure
- **Startup guard pattern**: define `WEAK_SECRETS` Set, check before `app.listen`, warn loudly without throwing
- **Test isolation for stateful middleware**: fresh instance per test file; `before()` (not `beforeEach()`) for state accumulation tests

### Key Lessons
1. **Run `/gsd:validate-phase` before `/gsd:audit-milestone`** — the audit can't check Nyquist compliance for phases that don't have VALIDATION.md yet; doing validation first saves a re-audit cycle
2. **`requirements-completed` in SUMMARY frontmatter is the source of truth** — don't rely on `dependency_graph.provides`; the 3-source cross-reference breaks when frontmatter is stale
3. **Document route paths in ROADMAP phase details** — discrepancies between planned and actual paths are invisible until integration audit; verify `routes.js` during phase planning

### Cost Observations
- Model mix: 100% sonnet (claude-sonnet-4-6)
- Sessions: 3 (Phase 3 + Phase 4 + Phase 5 each in their own session)
- Notable: Plan execution was consistently 1–5 min; Nyquist auditor was fast due to all tests already passing

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Quick Tasks | Key Change |
|-----------|--------|-------------|------------|
| v1.0 | 2 formal | 8 | First GSD milestone; established quick task pattern for fixes |
| v1.1 | 3 formal | 0 | First milestone with Nyquist validation on all phases; no quick tasks needed |

### Cumulative Quality

| Milestone | Tests | Notes |
|-----------|-------|-------|
| v1.0 | 24 unit + 5 Jest integration | Node:test unit suite + Jest live integration tests |
| v1.1 | 135 total (91 new) | All phase-critical paths covered; 100% pass rate |

### Top Lessons (Verified Across Milestones)

1. Run `milestone complete` before `cleanup` to preserve accurate phase/plan counts in the archive
2. Update REQUIREMENTS.md checkboxes at implementation time — don't leave for audit
3. Run `/gsd:validate-phase` before `/gsd:audit-milestone` — Nyquist status in the audit is stale if VALIDATION.md doesn't exist yet
4. Always write `requirements-completed` in SUMMARY frontmatter — the 3-source cross-reference breaks on `dependency_graph.provides` alone
