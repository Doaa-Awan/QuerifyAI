---
phase: quick-6
plan: "01"
subsystem: chat-pipeline
tags: [transparency, metadata, pii-masking, token-tracking, ui]
dependency_graph:
  requires: []
  provides: [query-metadata-line, pii-column-tracking, token-count]
  affects: [chat-ui, postgres-service, chat-service, query-controller]
tech_stack:
  added: []
  patterns: [metadata-propagation, two-pass-instrumentation]
key_files:
  created: []
  modified:
    - server/services/postgres.service.js
    - server/services/chat.service.js
    - server/controllers/query.controller.js
    - client/src/components/chat/ChatBot.jsx
    - client/src/components/chat/ChatMessages.jsx
    - client/src/App.css
decisions:
  - "_piiColumns stored as _ prefixed key in table-metadata.json; filtered from table list sent to AI"
  - "relevantTables hoisted to sendMessage function scope so it can be included in return value"
  - "QueryMetaLine renders null when all metadata arrays are empty (no SQL response case)"
metrics:
  duration: "~8 min"
  completed: "2026-03-26"
  tasks_completed: 2
  files_modified: 6
---

# Phase quick-6 Plan 01: Add Query Metadata Line Summary

**One-liner:** Per-response metadata line showing cached tables, PII-masked columns, and combined Pass 1+2 token count below every bot message.

## What Was Built

Added end-to-end transparency metadata to the two-pass AI pipeline:

- **Backend instrumentation:** `sanitizeSamples` now tracks which column names were masked as PII and returns `{ sanitized, maskedColumns }`. The masked column list is written to `table-metadata.json` under the `_piiColumns` key.
- **Token tracking:** `selectRelevantTables` (Pass 1) captures `response.usage.total_tokens` and returns `{ tables, pass1Tokens }`. The Pass 2 token count is captured after the main chat completion call. Both are summed in the `sendMessage` return.
- **API response expansion:** `handleQuery` in the controller propagates `tablesCached`, `piiColumnsMasked`, and `tokenCount` to the JSON response.
- **UI component:** `QueryMetaLine` renders a subtle metadata line below each bot message. PII section appears only when columns were masked. Token count is comma-formatted via `toLocaleString()`.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1 | Instrument backend — PII columns, pass1 tokens, API metadata | 1a809b8 |
| 2 | Render QueryMetaLine in chat UI | c3a5bff |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Hoisted `relevantTables` to function scope in `sendMessage`**
- **Found during:** Task 1
- **Issue:** `relevantTables` was declared with `let` inside the `if (tableMetadata)` block, making it inaccessible at the return statement where `tables_cached` needed to be populated.
- **Fix:** Declared `let relevantTables = null` at function scope before the `if (tableMetadata)` block; removed the inner `let relevantTables` declaration.
- **Files modified:** `server/services/chat.service.js`
- **Commit:** 1a809b8

## Self-Check: PASSED

- FOUND: `.planning/quick/6-add-information-for-user-about-tables-ca/6-SUMMARY.md`
- FOUND commit `1a809b8`: feat(quick-6): instrument backend to expose PII columns, token counts, and cached tables
- FOUND commit `c3a5bff`: feat(quick-6): render QueryMetaLine below bot messages in chat UI
