# Roadmap: Querify — AI Database Explorer

## Milestones

- ✅ **v1.0 Portfolio MVP** — Phases 1-2 (shipped 2026-03-26)
- 🚧 **v1.1 Security Hardening** — Phases 3-5 (in progress)

## Phases

<details>
<summary>✅ v1.0 Portfolio MVP — SHIPPED 2026-03-26</summary>

- [x] Phase 1: Query API and Memory Safety (2/2 plans) — completed 2026-03-10
- [x] Phase 2: Deployment and Demo UX (2/3 formal plans + 8 quick tasks) — completed 2026-03-26

Full phase details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Security Hardening (In Progress)

**Milestone Goal:** Harden the app's security posture by fixing the session flag bug on connect handlers, rate-limiting connect endpoints, making SSL configurable, and closing PII masking gaps with test coverage.

- [x] **Phase 3: Session Flag Fix** - Set session flag reliably on both connect handlers so downstream middleware can trust the session — completed 2026-03-27
- [x] **Phase 4: Rate Limiting and SSL Hardening** - Apply connect rate limiter, make SSL configurable via env, and guard against weak SESSION_SECRET in production (completed 2026-03-27)
- [ ] **Phase 5: PII Masking Hardening and Test Coverage** - Close PII masking gaps for ssn/dob/passport columns, handle JSON parse failures, and add critical-path tests

## Phase Details

### Phase 3: Session Flag Fix
**Goal**: Both connect handlers (demo DB and real DB) reliably set the session flag so future middleware enforcement can trust it
**Depends on**: Phase 2 (v1.0 complete)
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. After connecting to the demo DB, a subsequent request that checks `req.session.connected` finds it set to `true`
  2. After connecting to a real PostgreSQL or SQL Server DB, a subsequent request that checks `req.session.connected` finds it set to `true`
  3. A failed connect attempt does not leave a session flag set to `true`
**Plans**: 03-01-PLAN.md

### Phase 4: Rate Limiting and SSL Hardening
**Goal**: Connect endpoints are protected against brute-force credential attacks, SSL validation is configurable for different environments, and a weak SESSION_SECRET in production is surfaced loudly
**Depends on**: Phase 3
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Making more than 10 POST /db/connect requests within 15 minutes from the same IP returns HTTP 429 on the 11th request
  2. When `POSTGRES_SSL_REJECT_UNAUTHORIZED=false` is set, the server connects to a self-signed cert DB without error; when the env var is absent or `true`, it enforces cert validation
  3. When the server starts in production (`NODE_ENV=production`) with the default weak SESSION_SECRET, it emits a console warning (or throws) before accepting requests
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Add connectLimiter to rateLimiter.js and wire to all 5 connect routes
- [ ] 04-02-PLAN.md — Make Postgres SSL rejectUnauthorized configurable via POSTGRES_SSL_REJECT_UNAUTHORIZED env var
- [ ] 04-03-PLAN.md — Add weak SESSION_SECRET startup guard in server.js

### Phase 5: PII Masking Hardening and Test Coverage
**Goal**: The PII masking layer covers all known sensitive column name patterns (including ssn, dob, and passport), handles AI parse failures gracefully, and the critical path is covered by unit and integration tests
**Depends on**: Phase 4
**Requirements**: PII-01, PII-02, PII-03, PII-04, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. A schema snapshot containing `ssn`, `social_security`, `dob`, `birth_date`, and `passport` columns never sends real values to the LLM — each is replaced with its safe placeholder regardless of column storage type
  2. An AI table-description response that contains malformed JSON does not propagate an uncaught exception — the service returns an empty object and continues
  3. The node:test suite passes with tests covering all 24 PII name patterns, each `buildDummyValue` branch, full `sanitizeSamples` masking, `requireSession` 401/next behaviour, and `connectLimiter` 429 behaviour
  4. `cd server && node --test tests/*.test.js` exits zero with no skipped tests for the above suites
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Fix isLikelyPiiColumn, buildDummyValue (ssn/dob/passport branches), and generateTableDescriptions JSON parse guard
- [ ] 05-02-PLAN.md — Create pii.unit.test.js: 35+ tests for isLikelyPiiColumn (24 patterns), buildDummyValue (all branches), sanitizeSamples
- [ ] 05-03-PLAN.md — Create middleware.unit.test.js: requireSession 401/next and connectLimiter 429 tests

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Query API and Memory Safety | v1.0 | 2/2 | Complete | 2026-03-10 |
| 2. Deployment and Demo UX | v1.0 | 3/3 | Complete | 2026-03-26 |
| 3. Session Flag Fix | v1.1 | 1/1 | Complete | 2026-03-27 |
| 4. Rate Limiting and SSL Hardening | v1.1 | 3/3 | Complete | 2026-03-27 |
| 5. PII Masking Hardening and Test Coverage | 1/3 | In Progress|  | - |
