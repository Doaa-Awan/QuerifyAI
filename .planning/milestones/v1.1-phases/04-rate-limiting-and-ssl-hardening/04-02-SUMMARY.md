---
phase: 04-rate-limiting-and-ssl-hardening
plan: "02"
subsystem: database
tags: [postgres, ssl, security, env-var]

# Dependency graph
requires:
  - phase: 03-session-flag-fix
    provides: session flag set on all connect handlers, enabling safe DB access gating
provides:
  - POSTGRES_SSL_REJECT_UNAUTHORIZED env var controls rejectUnauthorized on pg Pool SSL config
  - server/.env.example documents the SSL var with usage guidance
affects:
  - any future phase that modifies createPostgresClient or DB connection logic

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Secure-by-default env var opt-out: env !== 'false' evaluates true unless exact string 'false' is set"

key-files:
  created: []
  modified:
    - server/services/postgres.service.js
    - server/.env.example

key-decisions:
  - "rejectUnauthorized defaults to true (secure); only exact string 'false' opts out — prevents accidental downgrade from typos"

patterns-established:
  - "Secure-by-default toggle: use `process.env.VAR !== 'false'` so absent/empty/typo values stay secure"

requirements-completed: [SEC-02]

# Metrics
duration: 1min
completed: 2026-03-27
---

# Phase 4 Plan 02: SSL rejectUnauthorized Configurable via Env Var Summary

**PostgreSQL SSL cert validation is now secure by default — POSTGRES_SSL_REJECT_UNAUTHORIZED env var opts out for dev/self-signed cert environments only when explicitly set to 'false'**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-27T14:20:42Z
- **Completed:** 2026-03-27T14:21:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed hardcoded `rejectUnauthorized: false` in `createPostgresClient` — production connections now validate SSL certificates by default
- `POSTGRES_SSL_REJECT_UNAUTHORIZED` env var allows operators to opt out for development/self-signed cert environments
- Documented the new env var in `server/.env.example` with clear instructions on when to use it

## Task Commits

Each task was committed atomically:

1. **Task 1: Make SSL rejectUnauthorized configurable in createPostgresClient** - `4d50180` (fix)
2. **Task 2: Document POSTGRES_SSL_REJECT_UNAUTHORIZED in server/.env.example** - `44f0508` (chore)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `server/services/postgres.service.js` - `createPostgresClient` reads `POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false'` to set rejectUnauthorized; secure by default
- `server/.env.example` - Added SSL section with `POSTGRES_SSL_REJECT_UNAUTHORIZED=true` and explanatory comment

## Decisions Made

- Used `process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false'` (not `=== 'true'`) so the secure default applies when the var is absent, empty, or any value other than exact string `'false'`. This prevents accidental SSL downgrade from typos or missing config.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Operators deploying to production: no action needed — `rejectUnauthorized` now defaults to `true`.

For development against a self-signed certificate, add to your `.env`:
```
POSTGRES_SSL_REJECT_UNAUTHORIZED=false
```

## Next Phase Readiness

- SSL hardening complete for Phase 4 Plan 02
- Ready for remaining Phase 4 plans (rate limiting, helmet headers, etc.)

---
*Phase: 04-rate-limiting-and-ssl-hardening*
*Completed: 2026-03-27*
