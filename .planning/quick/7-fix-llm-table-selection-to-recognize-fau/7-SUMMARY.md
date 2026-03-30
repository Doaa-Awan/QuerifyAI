# Quick Task 7: Fix LLM Table Selection to Recognize Faults as Tickets

**Date:** 2026-03-26
**Commit:** c32623f

## Problem

When users asked about "tickets", the app consistently failed to select the `faults` table (which is the tickets table). Root causes were all in `server/services/chat.service.js`:

1. Short queries like "show all tickets" (≤3 words) were flagged as follow-ups, skipping Pass 1 and reusing stale cached tables from a prior unrelated query
2. When Pass 1 returned `[]` (no tables found), the code merged with cached tables → old company/users tables stayed in context
3. Column names were hidden from Pass 1 when a description existed — the table list showed descriptions OR columns, never both
4. No semantic-mapping hint in the Pass 1 prompt — model had no guidance that "tickets" could map to "faults"

## Changes

### `server/services/chat.service.js`
- **`isFollowUpQuery`**: Removed the `≤3 words` short-query heuristic — short queries now always run Pass 1
- **`selectRelevantTables` table list**: Always include column names alongside descriptions (e.g. `faults: Stores fault records. Columns: faultid, faultdesc, status...`)
- **`selectRelevantTables` prompt**: Added semantic-mapping note: "User queries may use everyday business terms that differ from internal table names"
- **`sendMessage` merge logic**: Changed `if (newTables && cached)` → `if (newTables !== null && newTables.length > 0 && cached)` — empty Pass 1 result now falls back to full schema instead of reusing stale cache

### `server/services/postgres.service.js`
- **`generateTableDescriptions` prompt**: Added instruction to include common business synonyms in descriptions (takes effect on next DB reconnect/snapshot regeneration)

## Outcome

Pass 1 now has enough semantic signal to map "tickets" → `faults` via column names and the synonym instruction. The stale-cache bug no longer causes wrong table selection for new topics. The description generation improvement will further help future DB connections.
