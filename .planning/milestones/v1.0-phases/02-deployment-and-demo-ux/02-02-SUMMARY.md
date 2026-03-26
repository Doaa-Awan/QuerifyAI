---
phase: 02-deployment-and-demo-ux
plan: 02
subsystem: ui
tags: [react, cold-start, rate-limit, ux, banner, polling, localStorage]

# Dependency graph
requires:
  - phase: 02-deployment-and-demo-ux/02-01
    provides: API_BASE from api.js module; legacyHeaders: true on rate limiters so x-ratelimit-remaining header is available

provides:
  - ColdStartBanner component (exponential backoff /health poller, shown on login screen)
  - RateLimitBanner component (three-state info/warning/blocked with localStorage dismiss persistence)
  - isBlocked prop flow from DbExplorer -> ChatBot -> ChatInput (textarea + button disabled)

affects: [chat-input, login, db-explorer, future-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cold-start UX: 3s silent delay then exponential backoff polling; resolves silently on success"
    - "Three-state banner: info (dismissible) / warning (persistent) / blocked (persistent + disables input)"
    - "Prop threading: parent derives isBlocked from rateLimitInfo state; passes to child components"

key-files:
  created:
    - client/src/components/ColdStartBanner.jsx
    - client/src/components/RateLimitBanner.jsx
  modified:
    - client/src/components/Login.jsx
    - client/src/DbExplorer.jsx
    - client/src/components/chat/ChatBot.jsx
    - client/src/components/chat/ChatInput.jsx
    - client/src/App.css

key-decisions:
  - "CSS uses project design tokens (--surface, --line, --muted, --accent) instead of --color-* variables specified in plan — project uses its own token names"
  - "ColdStartBanner wrapped in React fragment in Login return to avoid extra DOM wrapper"
  - "ChatInput receives disabled prop and applies it to both textarea and submit button for complete input blocking"

patterns-established:
  - "Cold-start polling: cancelled ref pattern with sleep() + exponential backoff in useEffect"
  - "Banner dismiss: localStorage key pattern with useEffect reset when state changes"

requirements-completed: [UX-01, UX-02, UX-03]

# Metrics
duration: 8min
completed: 2026-03-22
---

# Phase 2 Plan 02: Cold-Start and Rate Limit UX Banners Summary

**ColdStartBanner with 3s silent delay and exponential backoff polling, plus RateLimitBanner with three states (info/warning/blocked) that disables chat input when daily limit is reached**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-22T00:00:00Z
- **Completed:** 2026-03-22T00:08:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- ColdStartBanner polls `/health` after 3s silent wait; shows "Waking up the server..." with exponential backoff; resolves silently on 200; shows unavailability error after 90s total
- RateLimitBanner displays three states driven by `remaining` prop: info (>=10, dismissible), warning (1-9, persistent), blocked (0, persistent with GitHub repo link)
- Blocked state disables the chat textarea and submit button via `isBlocked` prop threaded through DbExplorer -> ChatBot -> ChatInput

## Task Commits

Each task was committed atomically:

1. **Task 1: ColdStartBanner component and Login.jsx mount** - `bf5f675` (feat)
2. **Task 2: RateLimitBanner component and DbExplorer.jsx mount with isBlocked** - `f42b077` (feat)

## Files Created/Modified
- `client/src/components/ColdStartBanner.jsx` - Created: health poller with 3s delay, exponential backoff, idle/waking/timeout states
- `client/src/components/RateLimitBanner.jsx` - Created: three-state rate limit banner with localStorage dismiss persistence
- `client/src/components/Login.jsx` - Modified: import and render ColdStartBanner at top of return
- `client/src/DbExplorer.jsx` - Modified: import RateLimitBanner, derive isBlocked, render banner above ChatBot, pass isBlocked to ChatBot
- `client/src/components/chat/ChatBot.jsx` - Modified: accept isBlocked prop, pass disabled={isBlocked} to ChatInput
- `client/src/components/chat/ChatInput.jsx` - Modified: accept disabled prop, apply to textarea and submit button
- `client/src/App.css` - Modified: add cold-start-banner and rate-limit-banner CSS using project design tokens

## Decisions Made
- CSS adapted to use project's actual design tokens (`--surface`, `--line`, `--muted`, `--accent`) rather than the `--color-*` names specified in the plan — the project's index.css uses its own token naming scheme
- ColdStartBanner placed inside a React fragment wrapper in Login's return rather than as a sibling outside the login-shell div, keeping it visually above the card
- ChatInput receives `disabled` applied to both the textarea and the submit button so blocked state prevents all input paths

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CSS variables adapted to match project's actual token names**
- **Found during:** Task 1 (ColdStartBanner CSS)
- **Issue:** Plan specified `--color-primary`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border` but project's index.css defines `--surface`, `--line`, `--ink`, `--muted`, `--accent`
- **Fix:** Replaced all `--color-*` references with project's actual CSS variable names in App.css
- **Files modified:** client/src/App.css
- **Verification:** CSS variables resolve correctly against :root definitions in index.css
- **Committed in:** bf5f675 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — wrong CSS variable names)
**Impact on plan:** Necessary for correct styling; no scope creep.

## Issues Encountered
None beyond the CSS variable name mismatch resolved above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both UX banners are live and wired to the correct screens
- Cold-start UX ready for Railway deploy where server sleeps between requests
- Rate-limit UX ready for demo visitors hitting the 20/day chat limit
- Phase 02-03 (if any) can proceed; chat input blocking is fully functional

---
*Phase: 02-deployment-and-demo-ux*
*Completed: 2026-03-22*
