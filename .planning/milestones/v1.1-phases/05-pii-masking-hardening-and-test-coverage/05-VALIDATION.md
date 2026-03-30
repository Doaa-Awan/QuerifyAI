---
phase: 5
slug: pii-masking-hardening-and-test-coverage
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) |
| **Config file** | `server/package.json` → `scripts.test` |
| **Quick run command** | `cd server && node --test tests/pii.unit.test.js tests/middleware.unit.test.js` |
| **Full suite command** | `cd server && node --test tests/*.test.js` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd server && node --test tests/pii.unit.test.js tests/middleware.unit.test.js`
- **After every plan wave:** Run `cd server && node --test tests/*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PII-01 | unit | `cd server && node --test tests/pii.unit.test.js` | ✅ | ✅ green |
| 05-01-02 | 01 | 1 | PII-02 | unit | `cd server && node --test tests/pii.unit.test.js` | ✅ | ✅ green |
| 05-01-03 | 01 | 1 | PII-03 | unit | `cd server && node --test tests/pii.unit.test.js` | ✅ | ✅ green |
| 05-01-04 | 01 | 1 | PII-04 | unit | `cd server && node --test tests/pii.unit.test.js` | ✅ | ✅ green |
| 05-02-01 | 02 | 1 | TEST-01 | unit | `cd server && node --test tests/pii.unit.test.js` | ✅ | ✅ green |
| 05-02-02 | 02 | 1 | TEST-02 | unit | `cd server && node --test tests/pii.unit.test.js` | ✅ | ✅ green |
| 05-02-03 | 02 | 1 | TEST-03 | integration | `cd server && node --test tests/pii.unit.test.js` | ✅ | ✅ green |
| 05-03-01 | 03 | 1 | TEST-04 | unit | `cd server && node --test tests/middleware.unit.test.js` | ✅ | ✅ green |
| 05-03-02 | 03 | 1 | TEST-05 | unit | `cd server && node --test tests/middleware.unit.test.js` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-29

---

## Validation Audit 2026-03-29

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Reconstructed from artifacts (State B). All 9 requirements (PII-01–04, TEST-01–05) covered by:
- `server/tests/pii.unit.test.js` — 85 tests (isLikelyPiiColumn × 29, buildDummyValue × 35, sanitizeSamples × 13, generateTableDescriptions × 1 contract test + PII-04 source inspection)
- `server/tests/middleware.unit.test.js` — 6 tests (requireSession × 4, connectLimiter × 2)

Full suite result at time of audit: **135/135 passing**.
