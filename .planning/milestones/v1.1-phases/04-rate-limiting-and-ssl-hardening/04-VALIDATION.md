---
phase: 04
slug: rate-limiting-and-ssl-hardening
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-27
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for rate limiting, SSL hardening, and SESSION_SECRET guard.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node.js built-in) |
| **Config file** | none — uses `node --test` directly |
| **Quick run command** | `cd server && node --test tests/security.hardening.unit.test.js` |
| **Full suite command** | `cd server && node --test tests/*.test.js` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `cd server && node --test tests/security.hardening.unit.test.js`
- **After every plan wave:** Run `cd server && node --test tests/*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-T1 connectLimiter export | 01 | 1 | SEC-01 | unit | `cd server && node --test tests/security.hardening.unit.test.js` | ✅ | ✅ green |
| 04-01-T2 routes wiring | 01 | 1 | SEC-01 | static | `cd server && node --test tests/security.hardening.unit.test.js` | ✅ | ✅ green |
| 04-02-T1 SSL env var logic | 02 | 1 | SEC-02 | unit | `cd server && node --test tests/security.hardening.unit.test.js` | ✅ | ✅ green |
| 04-02-T2 .env.example doc | 02 | 1 | SEC-02 | manual | — | — | manual-only |
| 04-03-T1 startup guard | 03 | 1 | SEC-03 | static | `cd server && node --test tests/security.hardening.unit.test.js` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

Tests were retroactively generated during `/gsd:validate-phase 4` (2026-03-27) via gsd-nyquist-auditor. All 4 gaps filled in a single pass. Full suite: 162 tests, 0 failures.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `server/.env.example` documents `POSTGRES_SSL_REJECT_UNAUTHORIZED` | SEC-02 | Config file documentation — no runtime behavior to assert | Open `server/.env.example`, verify it contains `POSTGRES_SSL_REJECT_UNAUTHORIZED` with a comment explaining when to set it to `'false'` |
| Rate limit 429 under real traffic | SEC-01 | `express-rate-limit` in-memory store behavior requires live HTTP requests | Start server; send 11 rapid POST requests to `/db/connect`; verify 11th returns HTTP 429 with `{ error, retryAfter: 900 }` |
| SSL opt-out with self-signed cert | SEC-02 | Requires live PostgreSQL with self-signed cert | Set `POSTGRES_SSL_REJECT_UNAUTHORIZED=false`; connect to self-signed-cert DB; verify no SSL error |
| SESSION_SECRET warning at startup | SEC-03 | Requires executing the server process | Run `NODE_ENV=production SESSION_SECRET=dev-secret-change-in-production node server/server.js 2>&1 \| head -10`; verify `[SECURITY WARNING]` appears before "Server is running" |

---

## Validation Sign-Off

- [x] All tasks have automated verify or documented manual-only reason
- [x] Sampling continuity: all 3 plans covered in a single test file
- [x] No Wave 0 MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-27

---

## Validation Audit 2026-03-27

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |
| Manual-only | 4 (docs + live-traffic behaviors) |
