---
phase: 05-pii-masking-hardening-and-test-coverage
plan: 02
subsystem: testing
tags: [node-test, pii, postgres-service, unit-tests, tdd]

requires:
  - phase: 05-01
    provides: "isLikelyPiiColumn and buildDummyValue named exports; PII guard ordering fix; ssn/dob/passport branches; JSON.parse try/catch in generateTableDescriptions"

provides:
  - "85-case unit test suite for all PII masking functions in postgres.service.js"
  - "Test coverage for all 29 piiNamePatterns entries in isLikelyPiiColumn"
  - "Test coverage for every buildDummyValue branch including type fallbacks"
  - "sanitizeSamples integration tests proving masking and non-masking behaviour"
  - "PII-04 contract test for generateTableDescriptions JSON parse failure path"

affects:
  - "future refactors of postgres.service.js PII functions"
  - "any plan that changes piiNamePatterns array or buildDummyValue branches"

tech-stack:
  added: []
  patterns:
    - "node:test / node:assert/strict for all server-side unit tests"
    - "Pure function unit tests with no DB connection or mock infrastructure"
    - "Contract tests (source inspection) when dependency injection is not available"

key-files:
  created:
    - server/tests/pii.unit.test.js
  modified:
    - server/services/postgres.service.js

key-decisions:
  - "Phone format test corrected to match actual implementation output (555010001, 9-char pad) — plan spec said 'or similar padded'"
  - "user_name branch ordering bug fixed in buildDummyValue: username/user_name check moved before generic _name branch so user_name returns user_1 not Name1"
  - "generateTableDescriptions PII-04 test uses source inspection (fs.readFile of service file) instead of dependency injection, as the function creates its own openai client internally"

patterns-established:
  - "Test all piiNamePatterns array entries individually — if the array changes, test count must be updated"
  - "Branch order in buildDummyValue matters: more-specific patterns (username/user_name) must precede generic patterns (_name fallback)"

requirements-completed: [TEST-01, TEST-02, TEST-03]

duration: 2min
completed: 2026-03-27
---

# Phase 05 Plan 02: PII Unit Tests Summary

**85-case node:test suite covering all 29 piiNamePatterns, every buildDummyValue branch, sanitizeSamples masking behaviour, and the PII-04 JSON parse failure contract**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T19:20:36Z
- **Completed:** 2026-03-27T19:22:46Z
- **Tasks:** 1 (write comprehensive test file)
- **Files modified:** 2

## Accomplishments
- Created `server/tests/pii.unit.test.js` with 85 passing test cases (0 failures)
- All 29 `piiNamePatterns` entries individually verified in `isLikelyPiiColumn` describe block
- Every `buildDummyValue` branch covered including ssn (string/integer/bigint), dob, passport, null/undefined passthrough, and type fallbacks (string/number/bigint/boolean)
- `sanitizeSamples` integration tests confirm masking of ssn/dob/passport/email and non-masking of primary key and score columns
- `generateTableDescriptions` PII-04 contract test confirms JSON.parse try/catch guard is present in source
- Full test suite (135 tests) still passes with 0 failures after the auto-fix deviation

## Task Commits

1. **Task 1: Create pii.unit.test.js + fix user_name branch ordering** - `504d59b` (test)

## Files Created/Modified
- `server/tests/pii.unit.test.js` - 85-case comprehensive PII unit test suite
- `server/services/postgres.service.js` - Fixed user_name branch ordering in buildDummyValue (Rule 1 bug fix)

## Decisions Made
- Phone test assertion corrected to `'555010001'` to match the actual `555010${String(n).padStart(3, '0')}` format with n=1
- PII-04 test implemented via source inspection rather than dependency injection — the function creates its own openai client internally with no injection seam, so inspecting the source for the try/catch guard achieves the same regression-detection purpose
- user_name branch ordering corrected (see Deviations)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed user_name branch ordering in buildDummyValue**
- **Found during:** Task 1 (test execution — user_name test failed returning 'Name1' instead of 'user_1')
- **Issue:** The `name === 'name' || name.endsWith('_name')` guard (line 153) ran before the `name.includes('username') || name.includes('user_name')` check (line 159). Since `'user_name'` ends with `'_name'`, it matched the name branch and returned `Name1` instead of the intended `user_1`.
- **Fix:** Moved the `username/user_name` check to line 152 (before the generic `_name` branch). Added inline comment explaining ordering requirement.
- **Files modified:** `server/services/postgres.service.js`
- **Verification:** `buildDummyValue('user_name', 'alice', 0)` now returns `'user_1'`; full suite 135/135 pass
- **Committed in:** `504d59b` (task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Auto-fix corrected a production bug in the masking layer — `user_name` columns would have received `Name1` (a name) instead of `user_1` (a username placeholder). No scope creep.

## Issues Encountered
- Phone format in plan spec said `'5550100001'` (10 chars) with note "or similar padded". Actual implementation produces `'555010001'` (9 chars) via `555010${String(n).padStart(3, '0')}`. Test assertions updated to match actual output — the implementation is correct, the plan's example value was approximate.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PII masking layer is now fully tested with 85 cases covering all branches
- Regression safety established for future refactors of `postgres.service.js` PII functions
- Full suite at 135 tests / 0 failures — ready for any subsequent hardening phases

---
*Phase: 05-pii-masking-hardening-and-test-coverage*
*Completed: 2026-03-27*
