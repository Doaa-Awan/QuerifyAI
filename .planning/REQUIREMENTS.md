# Requirements: Querify — AI Database Explorer

**Defined:** 2026-03-26
**Core Value:** The two-pass AI pipeline that turns a plain English question into accurate SQL using only the relevant slice of the schema — without ever exposing real user data to the LLM.

## v1.1 Requirements

Requirements for the Security Hardening milestone.

### Session (AUTH)

- [x] **AUTH-01**: Server correctly sets session flag on demo DB connect so the session is trustworthy for future enforcement
- [x] **AUTH-02**: Server correctly sets session flag on real DB connect so the session is trustworthy for future enforcement

### Security Hardening (SEC)

- [x] **SEC-01**: Connect endpoints are rate-limited (10 req / 15 min) to prevent brute-force DB credential attacks
- [x] **SEC-02**: SSL certificate validation is configurable via `POSTGRES_SSL_REJECT_UNAUTHORIZED` env var (secure by default, opt-out for dev)
- [x] **SEC-03**: Server emits a loud warning (or throws) when weak default `SESSION_SECRET` is detected in production

### PII Masking (PII)

- [x] **PII-01**: `ssn` / `social_security` columns are masked as `***-**-****` regardless of storage type (including integer/bigint)
- [x] **PII-02**: `dob` / `birth` columns are replaced with placeholder date `1900-01-01`
- [x] **PII-03**: `passport` columns are masked as `redacted`
- [x] **PII-04**: AI table-description JSON parse failures are caught and return `{}` instead of propagating silently

### Test Coverage (TEST)

- [ ] **TEST-01**: Unit tests verify all 24 PII name patterns are correctly detected by `isLikelyPiiColumn`
- [ ] **TEST-02**: Unit tests verify each `buildDummyValue` branch produces safe output (including `ssn` as integer)
- [ ] **TEST-03**: Integration test verifies `sanitizeSamples` fully masks a mock schema with PII columns
- [ ] **TEST-04**: Unit tests verify `requireSession` returns 401 without session and calls `next()` with session
- [ ] **TEST-05**: Unit tests verify `connectLimiter` returns 429 after the limit is exceeded

## Future Requirements

### Auth Enforcement (deferred)

- **AUTH-03**: `requireSession` middleware is applied to `/api/chat`, `/api/query`, `/db/schema`, and snapshot endpoints (once session flag is reliably set)

### Observability (deferred)

- **OBS-01**: Rate limit banner shows time-until-reset to the user
- **OBS-02**: Dead code (`apiFetch` in api.js) is removed

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full `requireSession` route enforcement | Deferred — session flag must be proven reliable first (AUTH-01/02 this milestone); enforcement is a separate milestone decision |
| MySQL / SQLite support | Out of scope for demo tool; no demand signal |
| Persistent query history | Not core to portfolio value; single-user demo |
| Multi-user / auth / paid plans | Explicitly excluded — single-user demo tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 3 | Complete (2026-03-27) |
| AUTH-02 | Phase 3 | Complete (2026-03-27) |
| SEC-01 | Phase 4 | Complete |
| SEC-02 | Phase 4 | Complete |
| SEC-03 | Phase 4 | Complete |
| PII-01 | Phase 5 | Complete |
| PII-02 | Phase 5 | Complete |
| PII-03 | Phase 5 | Complete |
| PII-04 | Phase 5 | Complete |
| TEST-01 | Phase 5 | Pending |
| TEST-02 | Phase 5 | Pending |
| TEST-03 | Phase 5 | Pending |
| TEST-04 | Phase 5 | Pending |
| TEST-05 | Phase 5 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-27 — AUTH-01 and AUTH-02 marked complete after Phase 3 execution*
