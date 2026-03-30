# Milestones

## v1.1 Security Hardening (Shipped: 2026-03-30)

**Phases completed:** 3 phases (3–5), 7 plans
**Files changed:** 13 server files, +1,262 / -11 lines
**Test suite:** 135 tests passing (91 new in v1.1)
**Timeline:** 2026-03-14 → 2026-03-27 (13 days)

**Key accomplishments:**
- Session flag (`req.session.connected`) set reliably on all 5 connect handlers (Postgres + MSSQL) — AUTH-01, AUTH-02
- `connectLimiter` (10 req / 15 min, IP-based) wired to all 5 connect routes — SEC-01
- SSL `rejectUnauthorized` configurable via `POSTGRES_SSL_REJECT_UNAUTHORIZED` env var, secure-by-default — SEC-02
- Weak `SESSION_SECRET` startup guard in production (stderr warning before `app.listen`) — SEC-03
- PII masking gaps closed: SSN → `***-**-****`, DOB → `1900-01-01`, passport → `redacted`; JSON parse failures handled gracefully — PII-01–04
- 91 new unit + integration tests: all 29 PII patterns, all `buildDummyValue` branches, `sanitizeSamples` integration, `requireSession` 401/next, `connectLimiter` 429 — TEST-01–05

### Tech Debt Carried Forward

- AUTH-03 deferred: `requireSession` middleware exists and is tested but not yet wired to production routes
- `apiFetch` in `client/src/api.js` is dead code (OBS-02)
- `RateLimitBanner` blocked state doesn't forward time-until-reset (OBS-01)

---

## v1.0 Portfolio MVP (Shipped: 2026-03-26)

**Phases completed:** 2 phases, 3 formal plans + 8 quick tasks
**Files changed:** 76 | **Timeline:** 2026-03-09 → 2026-03-26 (17 days)
**Git range:** `feat(01-01)` → `quick-8`

**Key accomplishments:**
- `POST /api/query` endpoint with 200-entry FIFO SHA-256 cache, deprecating `/api/chat`
- Memory safety: `topicCache` capped at 100 entries, `conversations` Map at 200 / 20 msgs per conversation
- Vercel + Railway deployment — cross-origin session cookies, trust proxy, GET /health, deploy configs
- ColdStartBanner (3s delay + exponential backoff) and three-state RateLimitBanner (info/warning/blocked)
- ReactFlow ERD visualizer with FK edges, layered auto-layout, AI table descriptions, and FK hover highlighting
- SQL Server connection support added alongside PostgreSQL
- GitHub Actions CI/CD pipeline auto-promoting to production branch on main pass

### Known Gaps

- **ERD deviations**: MiniMap not implemented; row count badge missing
- **No VERIFICATION.md files** created during execute-phase for either formal phase

---

