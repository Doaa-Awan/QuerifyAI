# Phase 2: Deployment and Demo UX - Research

**Researched:** 2026-03-22
**Domain:** Railway/Vercel deployment, express-session cross-origin cookies, express-rate-limit headers, React cold-start polling, SPA routing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Demo DB credentials**
- PostgreSQL demo: Supabase (credentials already provisioned)
- SQL Server demo: Azure SQL Server (credentials already provisioned)
- Both wired as Railway env vars; plan must include which env var names to set
- Two demo connect buttons in the UI — one per DB type
- Buttons connect silently (one-click, no confirmation step)

**Rate limit header**
- Switch `rateLimiter.js` to `legacyHeaders: true` (add/change from `false`) so the server emits `X-RateLimit-Remaining`
- Frontend reads `X-RateLimit-Remaining` from response headers on every `/api/query` response
- Three banner states:
  - Info (>=10 remaining): dismissible banner; dismissal persists via `localStorage` key
  - Warning (1-9 remaining): persistent banner, not dismissible
  - Blocked (0 remaining): input disabled + persistent banner with CTA: "Daily limit reached. Clone the repo to use your own API key." (link to repo)
- Banner lives inside the chat interface (UX-03) — not on the connect/login screen

**api.js centralisation**
- Create `client/src/api.js` that exports:
  1. `export const API_BASE = import.meta.env.VITE_API_URL ?? ''`
  2. `export function apiFetch(path, options = {})` — prepends `API_BASE`, sets `credentials: 'include'` by default
- Update `ChatBot.jsx` and `Login.jsx` to import and use `apiFetch` (remove their inline `API_BASE` constants)
- No full refactor — only touch files that currently inline `VITE_API_URL`

**Cold start UX**
- Poll `GET /health` on every page load (app mount), always
- Show nothing for first 3 seconds; if no response by then, display "Waking up the server..." banner at the top of the chat panel
- Use exponential backoff: 3s base, doubling, capped at ~90s total
- On success: remove banner silently (fade out / no user action required)
- On timeout (no response after ~90s): replace banner with "Server is unavailable. Try refreshing in a few minutes."
- `GET /health` is a new bare endpoint (DEPL-03) separate from the existing `/health/db`

### Claude's Discretion
- Exact CSS styling for cold start and rate limit banners (colours, animation)
- Backoff implementation details (jitter, exact cap)
- Which files other than `ChatBot.jsx` and `Login.jsx` contain inline `VITE_API_URL` — Claude should grep and update all of them

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPL-01 | `express-session` cookie uses `sameSite: 'none'` and `secure: true` in production (env-gated) | Session cookie hardening section; trust proxy required |
| DEPL-02 | Frontend API calls use `import.meta.env.VITE_API_URL ?? ''` as base URL; dev proxy still works with empty string | api.js centralisation — only 2 files currently inline it |
| DEPL-03 | `GET /health` endpoint returns `200 OK` for Railway health check probe | Route addition to routes.js; railway.toml healthcheckPath = "/health" |
| DEPL-04 | `vercel.json` includes SPA routing rewrite (`"/*" -> "/index.html"`) | vercel.json rewrite syntax confirmed from official docs |
| DEPL-05 | `railway.toml` configured with `rootDirectory: server`, correct build/start commands | railway.toml config-as-code syntax confirmed |
| DEPL-06 | Supabase demo DB connection env vars set in Railway | Env var names already in `.env.example`; Azure SQL Server env var names also identified |
| UX-01 | Cold start handler polls `GET /health` with exponential backoff; shows message after 3s delay | React useEffect + AbortController pattern documented |
| UX-02 | Rate limit banner reads `X-RateLimit-Remaining` header; three states | legacyHeaders: true emits `X-RateLimit-*`; ChatBot already reads standardHeaders format — must switch header key |
| UX-03 | Rate limit banner appears inside chat interface, not on login/connect screen | Banner belongs in DbExplorer.jsx chat section |
</phase_requirements>

---

## Summary

This phase ships the already-working app to Railway (backend) + Vercel (frontend). The work is almost entirely configuration and thin UI components — no new business logic. The three implementation risks are: (1) cross-origin session cookies failing because `sameSite: 'lax'` is incompatible with cross-origin requests; (2) the rate limit header name mismatch — ChatBot.jsx currently reads `ratelimit-remaining` (standard header format) but the locked decision switches to `X-RateLimit-Remaining` (legacy format); and (3) the Vite proxy currently targets `localhost:8080` while the server `package.json` starts on PORT env var (defaulting to 5000 in `.env` handling). The cold start poller and rate limit banner are self-contained React components requiring no backend changes beyond the new `GET /health` route.

**Primary recommendation:** Execute in order: (1) server.js session + proxy fixes, (2) health route, (3) rateLimiter.js + api.js + header key fix in ChatBot.jsx, (4) vercel.json + railway.toml, (5) cold start + rate limit banner components, (6) env var deployment.

---

## Standard Stack

### Core (no new installs required)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express-rate-limit | ^8.2.1 (already installed) | Rate limit headers | Already in use; only config change needed |
| express-session | ^1.19.0 (already installed) | Cross-origin session cookies | Already in use; sameSite + secure change |
| Vite dev proxy | bundled with Vite 7 | Dev: routes /api, /db, /health to backend | Already configured in vite.config.js |

### Deployment Config Files (new files, no npm install)
| File | Purpose |
|------|---------|
| `vercel.json` | SPA rewrite so `/* -> /index.html`; Vite-built static files |
| `railway.toml` | Railway config-as-code: rootDirectory, build/start commands, health check path |

### No New npm Dependencies Required
All UX components (cold start banner, rate limit banner) use React + CSS variables already present. No animation library needed.

---

## Architecture Patterns

### Recommended Project Structure Changes
```
client/src/
├── api.js               # NEW: API_BASE + apiFetch helper
├── components/
│   ├── ColdStartBanner.jsx   # NEW: cold start polling component
│   ├── RateLimitBanner.jsx   # NEW: three-state rate limit banner
│   ├── chat/
│   │   └── ChatBot.jsx       # MODIFY: import apiFetch, switch header key
│   └── Login.jsx             # MODIFY: import apiFetch
server/
├── routes.js                 # MODIFY: add GET /health route
├── server.js                 # MODIFY: session sameSite/secure + app.set('trust proxy', 1)
└── middleware/
    └── rateLimiter.js        # MODIFY: legacyHeaders: true
vercel.json                   # NEW: SPA rewrite
railway.toml                  # NEW: deploy config
```

### Pattern 1: api.js Centralisation
**What:** Single export module so all fetch calls share base URL + credentials
**When to use:** Any component that calls the backend

```javascript
// client/src/api.js
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
  });
}
```

**Grep finding:** Only two files currently inline `VITE_API_URL`:
- `client/src/components/chat/ChatBot.jsx` (line 7) — uses `axios`, not `fetch`
- `client/src/components/Login.jsx` (line 35) — uses `axios`, not `fetch`

**Critical note:** Both files use `axios`, not `fetch`. `apiFetch` wraps native `fetch`. The plan must either (a) keep axios and just centralise `API_BASE` as a named export from `api.js`, or (b) replace axios calls with `apiFetch`. Option (a) is lower risk and fits the "no full refactor" constraint. Either approach is valid; option (a) is the safer scope.

### Pattern 2: Cold Start Poller
**What:** useEffect on mount, AbortController for cleanup, exponential backoff without external library

```javascript
// client/src/components/ColdStartBanner.jsx (pattern)
import { useEffect, useState } from 'react';

const MAX_WAIT_MS = 90_000;
const BASE_DELAY_MS = 3_000;

export default function ColdStartBanner({ apiBase = '' }) {
  const [state, setState] = useState('idle'); // idle | waking | timeout | ready

  useEffect(() => {
    let cancelled = false;
    let totalWaited = 0;
    let delay = BASE_DELAY_MS;

    const poll = async () => {
      // Wait BASE_DELAY before first banner show
      await sleep(BASE_DELAY_MS);
      if (cancelled) return;

      try {
        const res = await fetch(`${apiBase}/health`);
        if (res.ok) { setState('ready'); return; }
      } catch { /* not yet up */ }

      setState('waking');

      while (!cancelled && totalWaited < MAX_WAIT_MS) {
        await sleep(delay);
        totalWaited += delay;
        delay = Math.min(delay * 2, 30_000);
        try {
          const res = await fetch(`${apiBase}/health`);
          if (!cancelled && res.ok) { setState('ready'); return; }
        } catch { /* keep trying */ }
      }

      if (!cancelled) setState('timeout');
    };

    poll();
    return () => { cancelled = true; };
  }, [apiBase]);

  if (state === 'idle' || state === 'ready') return null;
  if (state === 'timeout') return <div className="cold-start-banner cold-start-banner--error">Server is unavailable. Try refreshing in a few minutes.</div>;
  return <div className="cold-start-banner">Waking up the server...</div>;
}
```

**Mounting point:** `DbExplorer.jsx` — add `<ColdStartBanner apiBase={API_BASE} />` at the top of the chat section (before `<ChatBot>`). `Login.jsx` also needs it since the server must be up before the demo connect buttons work.

### Pattern 3: Rate Limit Banner (Three States)
**What:** Reads `rateLimitInfo` prop from DbExplorer state; distinct visual states; localStorage dismiss key for info state

```javascript
// Pseudocode — exact styling at Claude's discretion
function RateLimitBanner({ remaining, dismissed, onDismiss }) {
  if (remaining == null) return null;

  if (remaining >= 10) {
    if (dismissed) return null;
    return <InfoBanner onDismiss={onDismiss} remaining={remaining} />;
  }
  if (remaining >= 1) {
    return <WarningBanner remaining={remaining} />;
  }
  // remaining === 0
  return <BlockedBanner repoUrl="https://github.com/..." />;
}
```

**localStorage key for dismiss:** `querify_ratelimit_dismissed` — persist across refreshes.

**Input disabled in blocked state:** `DbExplorer.jsx` passes `isBlocked` boolean to `ChatBot.jsx`; `ChatInput` renders `<input disabled>`.

### Pattern 4: Session Cookie for Cross-Origin Deployment
**What:** Railway (backend) and Vercel (frontend) are different origins. Browser blocks cookies with `sameSite: 'lax'` in cross-origin context.

```javascript
// server/server.js — production-safe session config
app.set('trust proxy', 1); // REQUIRED: Railway sits behind a proxy

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',   // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));
```

**Why `trust proxy`:** Without it, `req.secure` is false even on HTTPS when behind Railway's proxy layer, causing `secure: true` cookies to not be set.

### Pattern 5: GET /health Route
**What:** Bare endpoint at `/health` for Railway probe and cold start polling

```javascript
// In routes.js — add before existing routes
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

**Separation:** Keep existing `GET /health/db` (DB connectivity check) distinct. The new `/health` must return 200 immediately without hitting the DB — Railway uses it to verify the Node process started, not DB availability.

### Pattern 6: railway.toml
```toml
[build]
buildCommand = "npm install"
watchPatterns = ["server/**"]

[deploy]
startCommand = "node server.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ALWAYS"
```

**rootDirectory:** Set in Railway dashboard (not in railway.toml). Point it to `server/`.

### Pattern 7: vercel.json (SPA Rewrite)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Location:** Root of `client/` directory (or project root if Vercel root is set to `client/`). The rewrite makes direct URL navigation work without 404. Vercel serves actual static files before applying rewrites, so assets are unaffected.

### Anti-Patterns to Avoid
- **`sameSite: 'none'` without `secure: true`:** Browsers reject the cookie silently. Always pair them.
- **`sameSite: 'none'` in dev without HTTPS:** Local dev cannot be HTTPS easily; keep `lax` for dev, `none` for prod. The `NODE_ENV` gate handles this.
- **Missing `app.set('trust proxy', 1)`:** Without this, `req.secure` is always false behind Railway's proxy. Session cookies with `secure: true` will not be sent.
- **Rate limit headers: mixing standardHeaders and legacyHeaders formats:** Current `ChatBot.jsx` reads `ratelimit-remaining` (standard, lowercase). After switching to `legacyHeaders: true`, the header becomes `x-ratelimit-remaining` (case-insensitive in browsers, but the key name is different). The plan must update `ChatBot.jsx` to read `x-ratelimit-remaining` instead of `ratelimit-remaining`.
- **healthcheckPath hitting the DB:** If `/health` queries the DB on every Railway deploy, a DB blip will fail the deploy. Keep it a pure process liveness check.
- **`GET /health` in the Express router vs top-level:** The health route is in the router (routes.js), which is fine. It does not need auth middleware.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limit tracking | Custom counter in localStorage | Express-rate-limit headers | Server is authoritative; client-side count drifts |
| Exponential backoff math | Complex recursive timer | Simple while loop with `delay *= 2` | No library needed for ~4 iterations |
| SPA 404 fix | Express serving index.html | `vercel.json` rewrite | Vercel handles this natively |
| Cross-origin session | JWT tokens or rewriting auth | `sameSite: 'none'` + `secure: true` | Minimal change; sessions already work in dev |

---

## Common Pitfalls

### Pitfall 1: Rate Limit Header Name Mismatch
**What goes wrong:** ChatBot.jsx currently reads `ratelimit-remaining` (standardHeaders draft-6/7 format). After switching to `legacyHeaders: true`, the header emitted is `X-RateLimit-Remaining`. The frontend will always see `null` remaining and never show a banner.
**Why it happens:** express-rate-limit has two distinct header schemes with different names.
**How to avoid:** In the same plan that changes `rateLimiter.js`, update `ChatBot.jsx` to read `x-ratelimit-remaining` (browsers normalise header names to lowercase).
**Warning signs:** Banner never appears even after multiple queries.

### Pitfall 2: Trust Proxy Missing
**What goes wrong:** Railway fronts Node with a proxy; `req.secure` is always false. Session cookie with `secure: true` is never sent. All DB routes fail silently (no session).
**Why it happens:** Express default: trust proxy is off. `secure: true` requires `req.secure === true`.
**How to avoid:** Add `app.set('trust proxy', 1)` in `server.js` before the session middleware.
**Warning signs:** Connections succeed in dev but fail in production; 401/session errors on all DB endpoints.

### Pitfall 3: Cold Start Banner Mounted Only in DbExplorer
**What goes wrong:** User visits Vercel URL; server is cold. Login.jsx renders first, not DbExplorer.jsx. Banner never shows. User sees blank fields and stale "Server unavailable" API response, with no explanation.
**Why it happens:** The cold start banner is wired to DbExplorer but the first screen is Login.
**How to avoid:** Mount `<ColdStartBanner>` in `App.jsx` or `Login.jsx` so it covers the login screen too. The `/health` poll is independent of DB connectivity — it can run from any screen.

### Pitfall 4: vercel.json Placed in Wrong Directory
**What goes wrong:** If Vercel's root is set to `client/`, `vercel.json` must also be inside `client/`. If it's at the repo root and Vercel root is `client/`, the file is ignored and SPA refreshes 404.
**Why it happens:** Vercel reads `vercel.json` relative to its configured root directory.
**How to avoid:** Place `vercel.json` in `client/` (same directory as `index.html` and `vite.config.js`).

### Pitfall 5: railway.toml rootDirectory vs Dashboard Setting
**What goes wrong:** `rootDirectory` is a Railway dashboard setting (per-service), not a `railway.toml` field. Setting it in `railway.toml` has no effect; the file won't even be found if the dashboard rootDirectory is wrong.
**Why it happens:** Config-as-code (`railway.toml`) is read after Railway locates the service root.
**How to avoid:** Set rootDirectory to `server` in Railway dashboard first, then add `railway.toml` to the `server/` folder. The file is then at `server/railway.toml`.

### Pitfall 6: Demo DB Env Var Names
**What goes wrong:** The `.env.example` already defines the exact env var names used by `postgres.service.js` and `mssql.service.js`. If Railway env vars are named differently, the demo connect button silently fails with a credentials error.
**Why it happens:** Typos during manual Railway env var setup.
**How to avoid:** Use the exact names from `.env.example`:
- PostgreSQL demo: `DEMO_DB_HOST`, `DEMO_DB_PORT`, `DEMO_DB_USER`, `DEMO_DB_PASSWORD`, `DEMO_DB_NAME`, `DEMO_DB_SSL=true` (Supabase requires SSL)
- SQL Server demo: `DEMO_DB_HOST_SQL`, `DEMO_DB_USER_SQL`, `DEMO_DB_PASSWORD_SQL`, `DEMO_DB_NAME_SQL`
- Also required: `PORT`, `SESSION_SECRET`, `OPENROUTER_API_KEY`, `ALLOWED_ORIGINS` (set to Vercel URL), `NODE_ENV=production`

---

## Code Examples

### express-rate-limit with legacyHeaders enabled
```javascript
// server/middleware/rateLimiter.js — change legacyHeaders: false -> true
export const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: true,   // was false — now emits X-RateLimit-Remaining
  message: 'Daily query limit reached. Please try again tomorrow.',
  handler: rateLimitHandler,
});
```

Response headers after change:
- `X-RateLimit-Limit: 20`
- `X-RateLimit-Remaining: 17`
- `X-RateLimit-Reset: 1711238400`
- `RateLimit-Limit: 20` (standardHeaders also still present)
- `RateLimit-Remaining: 17`

Frontend reads: `response.headers['x-ratelimit-remaining']` (fetch normalises to lowercase).

**Current ChatBot.jsx reads:** `response.headers['ratelimit-remaining']` — this must change to `x-ratelimit-remaining` in the same plan.

### Session config for production
```javascript
// server/server.js
app.set('trust proxy', 1);  // add before session middleware

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));
```

### Reading rate limit header in ChatBot.jsx (after switch to legacyHeaders)
```javascript
// In onSubmit, replace ratelimit-remaining with x-ratelimit-remaining:
const rlRemaining = response.headers['x-ratelimit-remaining'];
const rlLimit = response.headers['x-ratelimit-limit'];
const rlReset = response.headers['x-ratelimit-reset'];
```

Note: ChatBot.jsx uses axios. Axios normalises response header names to lowercase. The header key is `x-ratelimit-remaining`.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `sameSite: 'lax'` for all environments | `sameSite: 'none'` + `secure: true` in production only | Required for cross-origin Railway/Vercel deploy |
| Manual health check (none) | `GET /health` with Railway healthcheckPath | Railway marks deploy healthy only after 200 |
| Inline `API_BASE` per component | Centralised `api.js` | Single source of truth; fewer env var mistakes |
| No SPA fallback | `vercel.json` rewrite | Eliminates 404 on direct URL navigation or refresh |

---

## Open Questions

1. **Supabase SSL requirement**
   - What we know: Supabase requires SSL. `.env.example` has `DEMO_DB_SSL=false` as default.
   - What's unclear: Whether existing `postgres.service.js` respects `DEMO_DB_SSL=true` to enable SSL for the demo pool.
   - Recommendation: Read `postgres.service.js` `connectDemo` method to verify SSL flag handling before setting Railway env vars. If SSL is not passed through, set `DEMO_DB_OPTIONS=?sslmode=require` or `DEMO_DB_SSL=true`.

2. **Vite proxy port mismatch**
   - What we know: `vite.config.js` proxies to `localhost:8080`. `server/.env.example` sets `PORT=8080`. The server runs on that port if `.env` is set correctly.
   - What's unclear: Whether the developer's local `.env` has `PORT=8080` (not checked — `.env` is gitignored).
   - Recommendation: Plan 02-01 should note that local dev requires `PORT=8080` in `server/.env`. No code change needed.

3. **connectLimiter missing from connect-demo routes**
   - What we know: STATE.md blocker: "connectLimiter applied to /db/connect and /db/connect-demo referenced in CONCERNS.md but never wired" — deferred to SEC-02 (v2).
   - What's unclear: Whether this affects the live demo (someone could hammer the demo connect button).
   - Recommendation: Out of scope for this phase per v2 deferral. Note in PLAN.md as known risk.

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (server/package.json test script is a stub echo) |
| Config file | None — see Wave 0 |
| Quick run command | Manual smoke test: `curl http://localhost:8080/health` |
| Full suite command | Manual e2e: visit Vercel URL, click demo connect, ask a question |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPL-01 | Cookie has sameSite=none + secure in prod | manual-only | Check browser DevTools Set-Cookie header on Railway | N/A |
| DEPL-02 | `VITE_API_URL` missing -> empty string -> Vite proxy works | smoke | `curl http://localhost:5173/api` in dev | N/A |
| DEPL-03 | GET /health returns 200 | smoke | `curl http://localhost:8080/health` | ❌ Wave 0 |
| DEPL-04 | Refreshing /some-route on Vercel does not 404 | manual-only | Visit Vercel URL, navigate, refresh | N/A |
| DEPL-05 | Railway starts with correct command | manual-only | Check Railway deploy log | N/A |
| DEPL-06 | Demo DB connect button works on live URL | manual-only | Click "Use Demo DB" on Vercel URL | N/A |
| UX-01 | "Waking up the server..." appears after 3s if no response | smoke | Cold start banner renders in browser; inspect with DevTools network throttle | ❌ Wave 0 |
| UX-02 | Rate limit banner shows correct state | smoke | Make 11+ queries; check banner state transitions | N/A |
| UX-03 | Rate limit banner not on login screen | smoke | Verify banner absent before connecting | N/A |

### Sampling Rate
- Per task commit: `curl http://localhost:8080/health` (DEPL-03 smoke)
- Per wave merge: Full manual smoke — connect demo DB, ask question, check banner, check network tab
- Phase gate: Vercel live URL passes all manual checks before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No formal test runner wired — acceptable for this phase; all checks are integration/smoke
- [ ] `server/railway.toml` file must exist before Railway deploy attempt
- [ ] `client/vercel.json` file must exist before Vercel deploy attempt
- Existing server tests: stub only (`echo "Error: no test specified"`)

---

## Sources

### Primary (HIGH confidence)
- Official Railway docs (fetched): `railway.toml` `[deploy]` section — `healthcheckPath`, `healthcheckTimeout`, `startCommand`, `buildCommand` fields verified
- Official Vercel docs (WebSearch verified): `vercel.json` `"rewrites"` array syntax for SPA fallback `{ "source": "/(.*)", "destination": "/index.html" }`
- Source code (direct read): `server/middleware/rateLimiter.js` — current `legacyHeaders: false` confirmed
- Source code (direct read): `server/server.js` — current session `sameSite: 'lax'` confirmed, no `trust proxy` setting
- Source code (direct read): `client/src/components/chat/ChatBot.jsx` — reads `ratelimit-remaining` (standardHeaders format)
- Source code (direct read): `server/.env.example` — env var names for demo DB credentials confirmed

### Secondary (MEDIUM confidence)
- express-rate-limit legacyHeaders behaviour: WebSearch result + cross-checked with current source code header reading in ChatBot.jsx (currently reading standardHeaders format). Switch confirmed needed.
- express-session `sameSite: 'none'` + `trust proxy`: Multiple community sources confirm Railway proxy requirement; aligns with express-session docs pattern.

### Tertiary (LOW confidence — flag for validation)
- Supabase SSL requirement for `DEMO_DB_SSL`: Assumed from Supabase's standard behaviour; not confirmed against actual demo credentials. Validate before Railway env var setup.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; only config changes
- Architecture: HIGH — all patterns verified against existing source code
- Pitfalls: HIGH — rate limit header mismatch, trust proxy gap confirmed by reading actual code
- Deployment config syntax: HIGH (Railway) / HIGH (Vercel) — fetched from official docs

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (stable platforms; Railway/Vercel APIs change slowly)
