---
phase: 04-rate-limiting-and-ssl-hardening
plan: 03
subsystem: infra
tags: [session, security, startup-guard, express-session, nodejs]

# Dependency graph
requires:
  - phase: 03-session-flag-fix
    provides: "session flag set reliably in all connect handlers"
provides:
  - "Startup guard that emits stderr warning when SESSION_SECRET is weak or missing in production"
affects: [deployment, docker, production-checklist]

# Tech tracking
tech-stack:
  added: []
  patterns: [startup-guard, known-weak-values-set, belt-and-suspenders-env-check]

key-files:
  created: []
  modified:
    - server/server.js

key-decisions:
  - "Use console.error (not console.warn or throw) so the message goes to stderr and the server continues to start"
  - "Three-condition check: missing, known weak value, or shorter than 32 chars"
  - "WEAK_SECRETS Set contains both the code fallback and the .env.example placeholder"

patterns-established:
  - "Startup guard pattern: define WEAK_SECRETS Set, run check before app.listen, warn loudly without throwing"

requirements-completed: [SEC-03]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 4 Plan 03: Weak SESSION_SECRET Startup Guard Summary

**Production startup guard in server.js that detects a missing or known-weak SESSION_SECRET and emits a loud stderr warning before the server begins accepting requests**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-27T14:20:00Z
- **Completed:** 2026-03-27T14:21:39Z
- **Tasks:** 1 of 1
- **Files modified:** 1

## Accomplishments
- Added `WEAK_SECRETS` Set containing both known placeholder values (`dev-secret-change-in-production` and `change-me-to-a-long-random-string`)
- Guard block inserted after `const PORT` and before `app.listen`, so warning appears in startup logs before any requests are served
- Three-condition check: secret missing entirely, matches a known weak value, or shorter than 32 chars
- Uses `console.error` (stderr) so the message stands out in deployment logs without killing the server

## Task Commits

Each task was committed atomically:

1. **Task 1: Add weak SESSION_SECRET startup guard to server.js** - `8bec660` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `server/server.js` - Added WEAK_SECRETS guard block before app.listen

## Decisions Made
- Used `console.error` not `console.warn` and not `throw` — stderr visibility without crashing an otherwise functional deployment
- Combined three conditions (missing, known-weak, short) for belt-and-suspenders coverage matching the plan spec

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The guard surfaces misconfigurations automatically at startup.

## Next Phase Readiness
- SEC-03 satisfied: production deployments now get a loud stderr warning when SESSION_SECRET is weak
- Phase 4 plan set is complete if this was the last plan; STATE.md will reflect updated position

---
*Phase: 04-rate-limiting-and-ssl-hardening*
*Completed: 2026-03-27*
