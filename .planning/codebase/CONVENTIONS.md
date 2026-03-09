# Coding Conventions

**Analysis Date:** 2026-03-09

## Naming Patterns

**Files:**
- Server: `camelCase.type.js` — e.g., `chat.service.js`, `postgres.controller.js`, `rateLimiter.js`
- Client components: `PascalCase.jsx` — e.g., `ChatBot.jsx`, `ChatMessages.jsx`, `ERDModal.jsx`
- Client utilities: `camelCase.js` — e.g., `ssmsTheme.js`
- Directories: `camelCase` (server) and `camelCase` (client) — `controllers/`, `services/`, `repositories/`, `middleware/`, `components/chat/`

**Functions:**
- Private helpers: `camelCase` — e.g., `buildInstructions`, `sanitizeSamples`, `isFollowUpQuery`
- Event handlers in React: `handle` prefix — e.g., `handleBack`, `handleCopy`, `handleKeyDown`, `handleZoomIn`
- Boolean predicates: `is`/`looks` prefix — e.g., `isMissingRequiredConfig`, `isFollowUpQuery`, `looksLikeEmail`, `isSqlBlock`
- Builder functions: `build` prefix — e.g., `buildInstructions`, `buildPartialSchemaContext`, `buildSnapshotMarkdown`

**Variables:**
- camelCase throughout — `topicCache`, `tableMetadata`, `relevantTables`, `schemaContext`
- Boolean flags: descriptive names — `available`, `isBotTyping`, `tooltipPinned`, `isPanning`
- Constants (module-level): `UPPER_CASE` in client components for fixed layout values — e.g., `CELL_WIDTH`, `STEP_X`, `PADDING`; `camelCase` for config objects

**Types/Interfaces (server return shapes):**
- Service methods return `{ ok: boolean, error?: string, status?: number, body?: object }` result objects uniformly
- Repository exports are plain objects with method keys — not classes

**Exports:**
- Server modules: named `export const` for singleton objects — e.g., `export const chatService = { ... }`, `export const postgresRepository = { ... }`
- Client components: `export default function ComponentName` or `export default ComponentName`
- Shared named exports: `export { sanitizeSamples }` when a private helper is needed by another module

## Code Style

**Formatting:**
- No Prettier config file detected — formatting is manually consistent
- Single quotes for strings in both server and client
- Trailing commas in multi-line arrays and objects
- Arrow functions for callbacks; regular `function` keyword for named helpers and standalone functions
- Template literals for string interpolation
- `const` preferred; `let` used only when reassignment is needed

**Linting:**
- ESLint 9 flat config in `client/eslint.config.js`
- Extends `@eslint/js` recommended + `eslint-plugin-react-hooks` recommended + `eslint-plugin-react-refresh`
- Key rule: `no-unused-vars` error, but uppercase vars are exempt (`varsIgnorePattern: '^[A-Z_]'`)
- No ESLint config for server — server is linted only by editor defaults

## Import Organization

**Server (ES modules):**
1. Node built-ins — `import { promises as fs } from 'fs'`, `import path from 'path'`
2. Third-party packages — `import express from 'express'`, `import OpenAI from 'openai'`
3. Local modules — `import { chatService } from '../services/chat.service.js'`

All server imports use explicit `.js` extension (required for Node ES modules).

**Client:**
1. Third-party packages — `import axios from 'axios'`, `import ReactMarkdown from 'react-markdown'`
2. React hooks — `import { useState, useRef, useEffect } from 'react'`
3. Local components — `import ChatBot from './components/chat/ChatBot'`
4. Local CSS — `import './App.css'`
5. Assets — `import postgresLogo from '/icons8-postgres.svg'`

**Path Aliases:**
- None used — all imports are relative paths

## Error Handling

**Server service methods — result object pattern:**
All service methods return a result object instead of throwing:
```js
// Success
return { ok: true };
return { ok: true, body: { ... } };

// Failure
return { ok: false, error: 'Human-readable message', status: 400 };
return { ok: false, status: 503, body: { error: '...' } };
```

**Controller layer:**
Controllers check `result.ok` and send appropriate HTTP responses. They never catch errors themselves — services absorb them:
```js
const result = await postgresService.connect(parseResult.data);
if (result.ok) {
  res.json({ message: 'Connected' });
  return;
}
res.status(result.status || 500).json({ error: result.error || 'Fallback message' });
```

**Validation errors (Zod):**
```js
const parseResult = connectSchema.safeParse(req.body);
if (!parseResult.success) {
  res.status(400).json({ error: parseResult.error.format() });
  return;
}
```

**Client error handling:**
- `try/catch` in async event handlers
- Errors displayed as plain text via local `error` state: `setError('Something went wrong. Please try again.')`
- `console.error` on caught errors for debugging: `console.error('Error submitting prompt:', err)`
- `axios` error shape accessed via `err.response?.data`

**Swallowed errors (intentional):**
- Pool close errors in `postgresRepository.replacePool` — `/* ignore */`
- File-not-found on `tableMetadataPath` unlink in `clearExplorerSnapshotFile` — empty catch
- JSON parse fallback in `chatService.sendMessage` — returns `{ sql: null, explanation: rawContent, tables_used: [] }`

## Logging

**Framework:** `console` (no logging library)

**Server patterns:**
- Prefixed with module context in brackets: `[chat]`, `[snapshot]`, `[connect]`
- `console.log` for operational trace: `console.log('[chat] pass 1 result:', newTables)`
- `console.warn` for degraded-but-recoverable paths: `console.warn('[snapshot] description generation failed...')`
- No `console.log` in controllers or repositories — only in services

**Client patterns:**
- `console.error` only, in catch blocks — not for flow tracing

## Comments

**When to Comment:**
- Section markers at top of each file: `// application logic`, `// data access code`, `// gateway`
- Before non-obvious functions: `// Heuristic: detect if the current query is a follow-up...`
- Inline for config intent: `// required for cookies/sessions to be sent cross-origin`
- Block comments before complex algorithms in ERDModal: `// BFS from the most-connected table so related tables land in adjacent grid cells`

**JSDoc/TSDoc:**
- Not used anywhere in the codebase — comments are plain prose

**Commented-out code:**
- Present in `ChatBot.jsx` (dead JSX block) — should be removed

## Function Design

**Size:** Helpers are generally small (10–30 lines). Services contain the largest functions: `buildSnapshotMarkdown` (~60 lines), `writeExplorerSnapshot` (~30 lines).

**Parameters:** Functions prefer plain objects or named params for complex inputs. Simple helpers take positional args.

**Return Values:**
- Helpers: return computed value directly
- Services: always return `{ ok, ... }` result objects
- DB layer (`server/db/postgres.js`): return raw `res.rows` or mapped arrays; throw on invalid pool

## Module Design

**Exports:**
- Each module exports one named singleton: `export const chatService`, `export const postgresRepository`
- `server/db/postgres.js` uses named function exports: `export { getSchema, getSampleRows, getTables, getRowCounts }`
- Middleware files use named function exports: `export function requireSession`, `export const chatLimiter`

**Barrel Files:**
- Not used — each file is imported directly by path

## Zod Validation

Zod schemas are defined at the top of each controller file as module-level `const`. Only `safeParse` is used — never `.parse()` (which throws). Schemas are strict — no `.passthrough()`.

```js
const connectSchema = z.object({
  host: z.string().trim().min(1, 'Host is required'),
  // ...
});
```

---

*Convention analysis: 2026-03-09*
