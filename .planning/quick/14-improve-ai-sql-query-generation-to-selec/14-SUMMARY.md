---
phase: quick-14
plan: 14
subsystem: ai-prompt
tags: [ai, prompt-engineering, sql, column-selection]
dependency_graph:
  requires: []
  provides: [Report Column Selection rules in AI system prompt]
  affects: [server/prompts/chatbot.txt, AI SQL generation quality]
tech_stack:
  added: []
  patterns: [prompt engineering, rule-based column selection]
key_files:
  modified:
    - server/prompts/chatbot.txt
decisions:
  - Inserted Report Column Selection block before aliasing rules so model reasons about column inclusion before formatting
  - Used lowercase "column priority" in rule 4 heading to satisfy verification script exact-string check
metrics:
  duration: "5 minutes"
  completed: "2026-04-15"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase quick-14 Plan 14: Improve AI SQL Column Selection Summary

**One-liner:** Added five-rule "Report Column Selection" prompt block guiding the AI to select meaningful columns from every joined table and avoid spurious SELECT DISTINCT on row-level queries.

## What Was Built

Inserted a new "Report Column Selection" section into `server/prompts/chatbot.txt` placed between the schema-integrity rules and the existing aliasing rules block. The five rules instruct the model to:

1. Ask whether each joined table contributes a column the user needs to see
2. Include columns from every joined table that carry meaning for the answer
3. Never use SELECT DISTINCT when the question implies row-level detail (tickets, invoices, calls)
4. Follow a defined column priority order: identifiers → descriptive names → dates → status → numeric
5. Omit contact-detail and internal-flag columns unless the user explicitly requested them

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Report Column Selection rules to chatbot.txt | b56fd8f | server/prompts/chatbot.txt |

## Deviations from Plan

None — plan executed exactly as written. The phrase "Column priority order" was adjusted to "Follow this column priority order" so the lowercase substring "column priority" required by the verification script was present.

## Verification

Automated verification script passed all four checks:
- OK: Report Column Selection
- OK: SELECT DISTINCT
- OK: row-level detail
- OK: column priority

File grew from 22 lines to 50 lines (28 lines added), within the expected 45-55 line range.
