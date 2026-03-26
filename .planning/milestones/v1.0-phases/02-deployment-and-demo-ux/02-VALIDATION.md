---
phase: 2
slug: deployment-and-demo-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — smoke tests via curl + manual browser checks |
| **Config file** | none — Wave 0 creates config files (railway.toml, vercel.json) |
| **Quick run command** | `curl http://localhost:8080/health` |
| **Full suite command** | Manual: connect demo DB on Vercel URL, ask question, verify banners |
| **Estimated runtime** | ~2 minutes (manual smoke) |

---

## Sampling Rate

- **After every task commit:** Run `curl http://localhost:8080/health`
- **After every plan wave:** Full manual smoke — connect demo DB, ask question, check rate limit banner, check cold start banner, verify no 404 on refresh
- **Before `/gsd:verify-work`:** Vercel live URL passes all manual checks
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DEPL-01 | manual | Check browser DevTools Set-Cookie header | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | DEPL-02 | smoke | `curl http://localhost:5173/api` in dev | ❌ Wave 0 | ⬜ pending |
| 02-01-03 | 01 | 1 | DEPL-03 | smoke | `curl http://localhost:8080/health` | ❌ Wave 0 | ⬜ pending |
| 02-01-04 | 01 | 1 | DEPL-04 | manual | Visit Vercel, navigate, refresh | N/A | ⬜ pending |
| 02-01-05 | 01 | 1 | DEPL-05 | manual | Check Railway deploy log | N/A | ⬜ pending |
| 02-02-01 | 02 | 2 | UX-01 | smoke | Network throttle in DevTools, verify banner after 3s | N/A | ⬜ pending |
| 02-02-02 | 02 | 2 | UX-02 | smoke | Make 11+ queries, verify banner state transitions | N/A | ⬜ pending |
| 02-02-03 | 02 | 2 | UX-03 | smoke | Verify banner absent before connecting | N/A | ⬜ pending |
| 02-03-01 | 03 | 3 | DEPL-06 | manual | Click demo connect on Vercel live URL | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/vercel.json` — SPA rewrite rule (`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`)
- [ ] `server/railway.toml` — Railway deploy config with healthcheck path, start command
- [ ] `GET /health` route in `server/server.js` — returns 200 without DB call

*No test framework install needed — this phase uses smoke tests + manual browser checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cookie has `sameSite=none` + `secure` in prod | DEPL-01 | Requires live Railway deployment + browser DevTools | Deploy to Railway, open DevTools > Network, check Set-Cookie header on any /db endpoint |
| SPA refresh does not 404 | DEPL-04 | Requires live Vercel deployment | Deploy to Vercel, navigate to /some-route, hit refresh |
| Railway starts with correct command | DEPL-05 | Requires Railway dashboard/logs | Check Railway deploy logs for startup command |
| Demo DB connect works on live URL | DEPL-06 | Requires all env vars set in Railway + live Vercel URL | Click "Use Demo DB" button on Vercel URL; verify DB connects and query works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
