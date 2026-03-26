# Phase 2: Deployment and Demo UX - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Get Querify live at a public URL with two pre-wired demo DB options and deployment-aware UX (cold start state + rate limit visibility). No new features — this phase makes what already exists shippable and self-explaining to portfolio visitors.

</domain>

<decisions>
## Implementation Decisions

### Demo DB credentials
- **PostgreSQL demo**: Supabase (credentials already provisioned)
- **SQL Server demo**: Azure SQL Server (credentials already provisioned)
- Both wired as Railway env vars; plan must include which env var names to set
- Two demo connect buttons in the UI — one per DB type
- Buttons connect silently (one-click, no confirmation step)

### Rate limit header
- Switch `rateLimiter.js` to `legacyHeaders: true` (add/change from `false`) so the server emits `X-RateLimit-Remaining`
- Frontend reads `X-RateLimit-Remaining` from response headers on every `/api/query` response
- Three banner states:
  - **Info** (≥10 remaining): dismissible banner; dismissal persists via `localStorage` key
  - **Warning** (1–9 remaining): persistent banner, not dismissible
  - **Blocked** (0 remaining): input disabled + persistent banner with CTA: "Daily limit reached. Clone the repo to use your own API key." (link to repo)
- Banner lives inside the chat interface (UX-03) — not on the connect/login screen

### api.js centralisation
- Create `client/src/api.js` that exports:
  1. `export const API_BASE = import.meta.env.VITE_API_URL ?? ''`
  2. `export function apiFetch(path, options = {})` — prepends `API_BASE`, sets `credentials: 'include'` by default
- Update `ChatBot.jsx` and `Login.jsx` to import and use `apiFetch` (remove their inline `API_BASE` constants)
- No full refactor — only touch files that currently inline `VITE_API_URL`

### Cold start UX
- Poll `GET /health` on every page load (app mount), always
- Show nothing for first 3 seconds; if no response by then, display "Waking up the server..." banner at the **top of the chat panel**
- Use exponential backoff: 3s base, doubling, capped at ~90s total
- On success: remove banner silently (fade out / no user action required)
- On timeout (no response after ~90s): replace banner with "Server is unavailable. Try refreshing in a few minutes."
- `GET /health` is a new bare endpoint (DEPL-03) separate from the existing `/health/db`

### Claude's Discretion
- Exact CSS styling for cold start and rate limit banners (colours, animation)
- Backoff implementation details (jitter, exact cap)
- Which files other than `ChatBot.jsx` and `Login.jsx` contain inline `VITE_API_URL` — Claude should grep and update all of them

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `client/src/components/chat/ChatBot.jsx`: already reads `VITE_API_URL` inline — primary consumer of `apiFetch` after centralisation
- `client/src/components/Login.jsx`: second inline consumer of `VITE_API_URL` — also uses `credentials: 'include'` pattern
- `server/middleware/rateLimiter.js`: `chatLimiter` applies to `/api/query`; needs `legacyHeaders: true` added
- `server/routes.js`: `/health/db` exists; new `GET /health` must be added as a separate top-level route

### Established Patterns
- Fetch calls use `credentials: 'include'` for session cookies — `apiFetch` must preserve this
- CSS variables + dark theme — banners should use existing `--color-*` variables, not hardcoded colours
- No TypeScript, no Tailwind — plain CSS modules or inline styles

### Integration Points
- Cold start component mounts in `client/src/DbExplorer.jsx` or top-level `App.jsx` (wherever the chat panel is rendered)
- Rate limit banner reads headers from `/api/query` SSE responses — must check if `fetch` streaming exposes response headers before the stream body
- Demo connect buttons are in `Login.jsx` (`connectDemo` + `connectDemoSqlserver` calls) — labels may need updating to reflect both DB types clearly

</code_context>

<specifics>
## Specific Ideas

- Blocked state banner should link directly to the GitHub repo — turns the rate limit into a portfolio conversion moment
- "Waking up the server..." is the exact copy from the requirements spec — keep it

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-deployment-and-demo-ux*
*Context gathered: 2026-03-22*
