---
phase: quick-8
plan: 8
subsystem: server/testing
tags: [jest, integration-tests, token-metrics, chat-service]
dependency_graph:
  requires: []
  provides: [jest-integration-test-runner, chat-token-metrics]
  affects: [server/services/chat.service.js, server/tests/]
tech_stack:
  added: [jest ^29.7.0, "@jest/globals ^29.7.0"]
  patterns: [Jest ESM native loader via NODE_OPTIONS, per-pass token usage tracking]
key_files:
  created:
    - server/jest.config.js
    - server/tests/integration/chat.accuracy.integration.test.js
  modified:
    - server/package.json
    - server/services/chat.service.js
decisions:
  - Integration test moved to tests/integration/ subdirectory so tests/*.test.js glob does not pick it up
  - pass1Usage/pass2Usage objects replace scalar pass1Tokens/pass2Tokens; token_count kept for backwards compat
metrics:
  duration: 2 min
  completed_date: "2026-03-26"
  tasks_completed: 3
  files_changed: 4
---

# Phase quick-8: Add Jest Tests for Chat Accuracy and Metrics Summary

**One-liner:** Jest integration test suite with 5 live AI accuracy tests and per-pass token cost metrics alongside the existing node:test suite.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add Jest devDependencies, script, and config | 07b482e | server/package.json, server/jest.config.js |
| 2 | Add granular token usage to chat.service.js | 9d8d067 | server/services/chat.service.js |
| 3 | Create live integration test file | 5d54fbd | server/tests/integration/chat.accuracy.integration.test.js |

## What Was Built

- **server/jest.config.js** — ESM-compatible Jest config (`transform: {}`, `testTimeout: 60000`)
- **server/package.json** — Added `jest ^29.7.0` and `@jest/globals ^29.7.0` to devDependencies; added `test:integration` script using `NODE_OPTIONS=--experimental-vm-modules`
- **server/services/chat.service.js** — Replaced scalar `pass1Tokens`/`pass2Tokens` with `pass1Usage`/`pass2Usage` objects `{input, output, total}`; `sendMessage` now returns a `tokens` field with per-pass and aggregate breakdowns alongside the existing `token_count` backwards-compat field
- **server/tests/integration/chat.accuracy.integration.test.js** — 5 live tests covering SLA tickets, time overage, device ticket frequency, invoices, and technician resolution time; each prints cost metrics via `console.table`; uses `crypto.randomUUID()` (Node global, no extra dep)

## Verification

- All 29 existing node:test tests pass (verified with `node --test tests/*.test.js`)
- Integration test file syntax verified (Jest globals error on direct node run is expected and confirms the file loads correctly)
- `npm run test:integration` will run 5 tests with live AI calls (requires `OPENROUTER_API_KEY` and demo DB access)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Moved integration test to subdirectory to prevent node:test glob conflict**
- **Found during:** Task 3 verification
- **Issue:** `tests/*.test.js` glob in the `test` script matched `chat.accuracy.integration.test.js`, causing the node:test runner to attempt loading a Jest-syntax file and fail
- **Fix:** Moved integration test to `tests/integration/` subdirectory. The `tests/*.test.js` glob no longer matches it. Jest's `--testPathPattern=integration` still matches the subdirectory path.
- **Files modified:** test file path changed from `tests/chat.accuracy.integration.test.js` to `tests/integration/chat.accuracy.integration.test.js`
- **Commit:** 88ca850

## Self-Check: PASSED

All key files exist. All task commits verified in git log.
