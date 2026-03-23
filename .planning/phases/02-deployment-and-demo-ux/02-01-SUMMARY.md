---
phase: 02-deployment-and-demo-ux
plan: "01"
subsystem: deployment
tags: [railway, vercel, session-cookie, cors, rate-limit, api-module]
dependency_graph:
  requires: []
  provides: [railway-deploy-config, vercel-deploy-config, cross-origin-session-cookie, health-endpoint, centralised-api-base]
  affects: [server/server.js, server/routes.js, server/middleware/rateLimiter.js, client/src/api.js, client/src/components/chat/ChatBot.jsx, client/src/components/Login.jsx]
tech_stack:
  added: [server/railway.toml, client/vercel.json, client/src/api.js]
  patterns: [trust-proxy, env-gated-sameSite, legacy-rate-limit-headers, centralised-api-base]
key_files:
  created:
    - client/src/api.js
    - client/vercel.json
    - server/railway.toml
  modified:
    - server/server.js
    - server/routes.js
    - server/middleware/rateLimiter.js
    - client/src/components/chat/ChatBot.jsx
    - client/src/components/Login.jsx
decisions:
  - "sameSite set to 'none' in production and 'lax' in dev via NODE_ENV guard — required for cross-origin session cookies between Railway backend and Vercel frontend"
  - "legacyHeaders: true emits X-RateLimit-* (legacy) alongside RateLimit-* (standard) — ChatBot.jsx reads x-ratelimit-remaining for the legacy key"
  - "api.js apiFetch wrapper is available for future use; ChatBot.jsx and Login.jsx continue using axios but import API_BASE from api.js for centralisation"
  - "railway.toml rootDirectory not set in file — must be configured in Railway dashboard to point to server/"
metrics:
  duration: "2 min"
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_changed: 8
---

# Phase 2 Plan 1: Cross-Origin Deploy Hardening Summary

Cross-origin session cookie hardening plus Railway/Vercel deploy configs using env-gated sameSite, trust proxy, GET /health, and centralised API_BASE.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Server hardening — trust proxy, session cookie, GET /health, legacyHeaders | 6da805e | server/server.js, server/routes.js, server/middleware/rateLimiter.js |
| 2 | api.js module + update ChatBot.jsx and Login.jsx + deploy config files | b71354a | client/src/api.js, client/src/components/chat/ChatBot.jsx, client/src/components/Login.jsx, client/vercel.json, server/railway.toml |

## What Was Built

**server/server.js** — Added `app.set('trust proxy', 1)` as first line after `const app = express()`. Changed `sameSite: 'lax'` to `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'` so the session cookie is accepted cross-origin in production while keeping lax locally.

**server/routes.js** — Added `GET /health` as the first route, returning `{ status: 'ok' }` immediately without touching any controller or DB. This is the Railway health check probe path.

**server/middleware/rateLimiter.js** — Changed `legacyHeaders: false` to `legacyHeaders: true` on both `chatLimiter` and `snapshotLimiter`. The server now emits `X-RateLimit-Remaining` (legacy format) which the frontend reads.

**client/src/api.js** — New module exporting `API_BASE` (sourced from `VITE_API_URL` env var, falls back to empty string for Vite dev proxy) and `apiFetch` helper (future use).

**client/src/components/chat/ChatBot.jsx** — Removed inline `const API_BASE = import.meta.env.VITE_API_URL || ''`. Added `import { API_BASE } from '../../api.js'`. Updated all three rate limit header reads from `ratelimit-*` to `x-ratelimit-*` (both the success path and the 429 error handler).

**client/src/components/Login.jsx** — Removed inline `const API_BASE = import.meta.env.VITE_API_URL || ''` from component body. Added `import { API_BASE } from '../api.js'` at the top of imports.

**client/vercel.json** — SPA rewrite: all routes fall through to `/index.html` so React Router handles client-side navigation without 404 on refresh.

**server/railway.toml** — Build and deploy config: `buildCommand = "npm install"`, `startCommand = "node server.js"`, `healthcheckPath = "/health"`, `healthcheckTimeout = 300`, `restartPolicyType = "ALWAYS"`.

## Verification Results

- `grep -r "VITE_API_URL" client/src/ --include="*.jsx"` — no results (only api.js defines it)
- `grep "'ratelimit-remaining'" client/src/` — no results (old key gone)
- `client/vercel.json` contains rewrites array
- `server/railway.toml` contains healthcheckPath = "/health"
- `legacyHeaders: true` on both limiters confirmed

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

**Files created:**
- client/src/api.js
- client/vercel.json
- server/railway.toml

**Files modified:**
- server/server.js
- server/routes.js
- server/middleware/rateLimiter.js
- client/src/components/chat/ChatBot.jsx
- client/src/components/Login.jsx

**Commits:**
- 6da805e — feat(02-01): server hardening
- b71354a — feat(02-01): api.js module and deploy configs
