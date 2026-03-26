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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Quick Tasks | Key Change |
|-----------|--------|-------------|------------|
| v1.0 | 2 formal | 8 | First GSD milestone; established quick task pattern for fixes |

### Cumulative Quality

| Milestone | Tests | Notes |
|-----------|-------|-------|
| v1.0 | 24 unit + 5 Jest integration | Node:test unit suite + Jest live integration tests |

### Top Lessons (Verified Across Milestones)

1. Run `milestone complete` before `cleanup` to preserve accurate phase/plan counts in the archive
2. Update REQUIREMENTS.md checkboxes at implementation time — don't leave for audit
