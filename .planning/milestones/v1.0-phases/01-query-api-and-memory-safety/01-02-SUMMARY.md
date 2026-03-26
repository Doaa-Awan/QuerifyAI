---
phase: 01-query-api-and-memory-safety
plan: "02"
subsystem: memory-safety
tags:
  - memory
  - maps
  - fifo
  - chatbot
  - testing
dependency_graph:
  requires:
    - 01-01
  provides:
    - MEM-01
    - MEM-02
    - MEM-03
    - QAPI-04
  affects:
    - server/services/chat.service.js
    - server/repositories/conversation.repository.js
    - client/src/components/chat/ChatBot.jsx
tech_stack:
  added: []
  patterns:
    - FIFO eviction guard (size check + delete oldest before set)
    - Per-conversation depth splice (trim oldest on overflow)
    - node:test / node:assert/strict for unit tests
key_files:
  created:
    - server/tests/chat.service.mem.test.js
    - server/tests/conversation.test.js
  modified:
    - server/services/chat.service.js
    - server/repositories/conversation.repository.js
    - client/src/components/chat/ChatBot.jsx
decisions:
  - Test helpers _getConversationsSize() and _getDepth() exported on conversationRepository to enable unit test introspection without exposing the private Map directly to production callers
  - MEM-03 satisfied as comment audit (not a runtime check) since postgres.repository.js uses a single dbState object, not a Map
  - topicCache tested via standalone fifoSet() helper rather than module export to keep the private Map private
metrics:
  duration: 2 min
  completed: "2026-03-10"
  tasks_completed: 2
  files_modified: 5
  tests_added: 12
---

# Phase 01 Plan 02: Memory Safety Caps and API Endpoint Switch Summary

**One-liner:** FIFO-capped topicCache (100 entries) and conversations Map (200 entries, 20 msgs/conv) eliminate OOM risk; ChatBot.jsx migrated from /api/chat to /api/query with camelCase field names.

## What Was Built

### Task 1: Cap topicCache (MEM-01) and conversations Map (MEM-02)

Both unbounded in-memory Maps are now bounded with FIFO eviction:

**server/services/chat.service.js** — topicCache:
- Added `MAX_TOPIC_CACHE = 100` constant
- Added FIFO guard before `topicCache.set()`: evicts oldest entry when at capacity

**server/repositories/conversation.repository.js** — conversations Map:
- Added `MAX_CONVERSATIONS = 200` and `MAX_MESSAGES_PER_CONVERSATION = 20`
- FIFO guard in `getHistory()` before `conversations.set()` for new IDs
- Depth splice in `appendMessage()` after `history.push()` — trims oldest messages when over 20
- Test helpers `_getConversationsSize()` and `_getDepth()` exported for unit testing
- MEM-03 audit comment block documenting all Maps in the codebase

**Tests:**
- `server/tests/chat.service.mem.test.js`: 5 tests validating the FIFO pattern used in topicCache
- `server/tests/conversation.test.js`: 7 tests covering Map cap at 200, depth cap at 20, message order

### Task 2: Switch ChatBot.jsx to /api/query and audit MEM-03

**client/src/components/chat/ChatBot.jsx:**
- URL: `/api/chat` → `/api/query`
- Request body: `{ prompt, conversationId, dialect }` → `{ question: prompt, conversationId }`
- Response destructuring: `tables_used` → `tablesUsed`
- `onTablesUsed` callback updated to pass `tablesUsed`

**MEM-03 audit** documented in conversation.repository.js comment: only 2 Maps exist in the server, both now capped; postgres.repository.js uses a single `dbState` object (no Map).

## Verification Results

- Full test suite: 24 tests, 0 failures
- `MAX_TOPIC_CACHE = 100` and FIFO guard confirmed in chat.service.js
- `MAX_CONVERSATIONS = 200`, `MAX_MESSAGES_PER_CONVERSATION = 20` and guards confirmed in conversation.repository.js
- ChatBot.jsx sends `{ question: prompt, conversationId }` to `/api/query`, reads `tablesUsed`
- MEM-03 audit comment present in conversation.repository.js

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

The TDD depth cap tests (per-conversation history trimming) were designed to use `_getDepth()` as a test introspection helper rather than relying solely on `getRecentMessages()` return length, which would have given a false-green since `slice(-20)` would have hidden the fact that the underlying array was never trimmed. This is intentional and correct.

## Commits

- `f892dd4` — feat(01-02): cap topicCache (MEM-01) and conversations Map (MEM-02)
- `4483f8b` — feat(01-02): switch ChatBot.jsx to /api/query endpoint

## Self-Check: PASSED

All files verified present. Both commits confirmed in git log.
