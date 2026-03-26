# Codebase Concerns

**Analysis Date:** 2026-03-09

---

## Security Considerations

**DB credentials sent in POST body on every connect:**
- Risk: Credentials travel over HTTP in plaintext if TLS is not enforced at the infrastructure level. No server-side credential storage means every page load that auto-reconnects re-sends them.
- Files: `client/src/App.jsx` (lines 112, 131), `server/controllers/postgres.controller.js` (connectAndIntrospect)
- Current mitigation: Helmet headers, CORS whitelist, HTTPS flag on cookie in production.
- Recommendations: Document clearly that this app must be deployed behind HTTPS. Consider a token-based reconnect flow so raw credentials are not re-sent on refresh.

**`requireSession` middleware is defined but never applied to any route:**
- Risk: All DB and chat endpoints are publicly accessible without a verified session. The `requireSession` guard is a dead import — it exists in `server/middleware/requireSession.js` but is not imported or used in `server/routes.js`.
- Files: `server/middleware/requireSession.js`, `server/routes.js`
- Current mitigation: None — any client can call `/api/chat`, `/db/schema`, `/db/explorer-context/snapshot`, and `/health/db` without authentication.
- Recommendations: Import and apply `requireSession` to at minimum `/api/chat`, `/db/schema`, `/db/explorer-context/snapshot`, and `/db/explorer-context/clear`.

**`/db/connect` and `/db/connect-demo` have no rate limiter:**
- Risk: Unlimited brute-force connection attempts against arbitrary remote databases, consuming server and pg pool resources.
- Files: `server/routes.js` (lines 16–17), `server/middleware/rateLimiter.js`
- Current mitigation: `chatLimiter` and `snapshotLimiter` exist but do not cover connect routes. Memory notes reference a `connectLimiter` that was never wired up.
- Recommendations: Add a `connectLimiter` (e.g., 10 attempts / 15 minutes) to both `/db/connect` and `/db/connect-demo`.

**`/db/connect` and `/db/connect-demo` do not set `req.session.connected`:**
- Risk: The legacy connect routes establish a live pool but do not mark the session. The app then uses `localStorage.querify_connected` as the client-side truth, which cannot be trusted by the server.
- Files: `server/controllers/postgres.controller.js` (connectDemo and connect handlers — neither calls `req.session.connected = true`)
- Current mitigation: `connectAndIntrospect` at `/api/connect` does set the session, but `App.jsx` currently calls the older `/db/connect` endpoint on form submit.
- Recommendations: Either consolidate all connect paths through `/api/connect`, or add `req.session.connected = true` to both legacy handlers.

**SSL `rejectUnauthorized: false` is always set when SSL is enabled:**
- Risk: Disables certificate validation, making TLS connections vulnerable to MITM attacks.
- Files: `server/services/postgres.service.js` (line 32)
- Current mitigation: None.
- Recommendations: Allow `rejectUnauthorized` to be configurable (e.g., an env flag for dev vs. prod), or at minimum document the risk prominently.

**Weak default `SESSION_SECRET` ships in code:**
- Risk: The literal string `'dev-secret-change-in-production'` is embedded in `server/server.js`. If `SESSION_SECRET` env var is omitted, sessions are signed with a guessable key.
- Files: `server/server.js` (line 29)
- Current mitigation: Comment says to change it; `.env.example` documents it.
- Recommendations: Add a server startup check that throws or warns loudly when `NODE_ENV === 'production'` and `SESSION_SECRET` equals the default.

---

## Tech Debt

**Duplicate connect path (legacy `/db/connect` vs. `/api/connect`):**
- Issue: Two parallel connection flows exist. `App.jsx` form calls `/db/connect` (no session set, no introspection). `DbExplorer` uses `/api/connect` (sets session, runs introspection). The snapshot is separately triggered via `/db/explorer-context/snapshot`. This three-step connect dance is fragile and inconsistent.
- Files: `client/src/App.jsx` (connect function, lines 109–126), `server/routes.js` (lines 17–18)
- Impact: If a user connects via the form but `/db/explorer-context/snapshot` fails silently, chat proceeds with no schema context and returns degraded responses.
- Fix approach: Consolidate on `/api/connect` which already does connect + introspect + snapshot atomically. Remove or deprecate `/db/connect`.

**`dialect` field accepted by frontend but ignored by backend:**
- Issue: `ChatBot.jsx` sends `dialect: dialect ?? 'sql'` in every chat request. The chat controller Zod schema does not include `dialect`, and `chat.service.js` never reads it.
- Files: `client/src/components/chat/ChatBot.jsx` (line 44), `server/controllers/chat.controller.js` (chatSchema), `server/services/chat.service.js`
- Impact: Dead UI — the dialect toggle is cosmetic only. Even the SQL option does nothing server-side.
- Fix approach: Either remove the dialect field and toggle until the feature is implemented, or add dialect to the Zod schema and prompt template.

**`topicCache` in `chat.service.js` grows unbounded:**
- Issue: `const topicCache = new Map()` at module scope accumulates one entry per `conversationId` and is never evicted. Long-running servers leak memory proportional to total unique conversations.
- Files: `server/services/chat.service.js` (line 25)
- Impact: Gradual memory leak in production; negligible for a demo.
- Fix approach: Add TTL-based eviction or cap the Map size with LRU eviction.

**`conversationRepository` message history grows unbounded:**
- Issue: `const conversations = new Map()` in `conversation.repository.js` holds all messages for all conversations since process start with no eviction. `getRecentMessages` slices the last 10 but the full history is kept in memory.
- Files: `server/repositories/conversation.repository.js`
- Impact: Same memory leak pattern as `topicCache`, compounded because each entry stores full AI JSON responses.
- Fix approach: Truncate stored history to a fixed depth (e.g., 20 messages) on `appendMessage`.

**Schema and pool state stored in module-level globals:**
- Issue: `postgresRepository` (`dbState`), `schemaStore` (`storedSchema`), and `conversationRepository` (`conversations`) are module singletons. In any multi-process or cluster deployment they diverge instantly.
- Files: `server/repositories/postgres.repository.js`, `server/services/schemaStore.js`, `server/repositories/conversation.repository.js`
- Impact: Not a problem for single-process demo; fatal if scaled horizontally.
- Fix approach: Acceptable for current scope. For future scaling, externalize to Redis or a database.

**`generateTableDescriptions` result not validated before `JSON.parse`:**
- Issue: The AI response is stripped of code fences then parsed directly. If the model returns malformed JSON, `JSON.parse` throws and is caught only by the outer try/catch in `writeExplorerSnapshot`, which logs a warning and continues with empty descriptions, silently degrading chat quality.
- Files: `server/services/postgres.service.js` (lines 312–314)
- Impact: Snapshot proceeds with no table descriptions; first-pass table selection in chat falls back to column names only.
- Fix approach: Wrap `JSON.parse(jsonStr)` inside `generateTableDescriptions` in its own try/catch and return `{}` on failure.

**`db-explorer-context.md` and `table-metadata.json` are shared mutable files on disk:**
- Issue: Snapshot data is written to `server/prompts/` at fixed paths. Concurrent connect requests from different users overwrite each other's context. There is no per-session isolation.
- Files: `server/services/postgres.service.js` (`explorerPromptPath`, `tableMetadataPath`), `server/prompts/`
- Impact: In a multi-user scenario, user A's chat could receive user B's schema context.
- Fix approach: For single-user demo this is acceptable. For multi-user: store context in a per-session in-memory map rather than on disk.

---

## Known Bugs

**`connectDemo` handler never sets `req.session.connected`:**
- Symptoms: User who connects via "Use Demo DB" button has no server session, so if `requireSession` were enabled any subsequent API call would return 401.
- Files: `server/controllers/postgres.controller.js` (connectDemo, lines 20–29)
- Trigger: Click "Use Demo DB" on login screen.
- Workaround: `requireSession` is not currently applied to routes, so no visible failure today.

**`App.jsx` mount effect fires snapshot request automatically on page refresh:**
- Symptoms: On page load when `checkDbStatus()` returns true (server pool still alive), the client fires `/db/explorer-context/snapshot` automatically. This consumes one of the 5 hourly snapshot rate-limit slots without user intent.
- Files: `client/src/App.jsx` (lines 147–157)
- Trigger: Hard-refresh the page while the server process is still running with an active pool.
- Workaround: None.

**React `key={index}` used on chat message list:**
- Symptoms: If messages are ever removed or reordered, React reconciles incorrectly using array index as key, potentially causing stale rendered content.
- Files: `client/src/components/chat/ChatMessages.jsx` (line 81)
- Trigger: Any scenario where messages are removed or reordered (not possible today but no structural barrier prevents it).
- Workaround: Messages are currently append-only, so this does not manifest yet.

---

## Performance Bottlenecks

**`getSampleRows` re-fetches the allowed table list on every call (N+1 queries):**
- Problem: Every table sampled during snapshot generation fires a separate `getTables` query to validate the table name.
- Files: `server/db/postgres.js` (getSampleRows), `server/services/postgres.service.js` (snapshot loop, lines 338–340)
- Cause: Safety check `allowedTables.includes(table)` re-fetches the table list rather than receiving it as a parameter.
- Improvement path: Pass the already-fetched `tables` array into `getSampleRows` to eliminate redundant queries.

**`introspectionService.introspect` fetches sample rows sequentially:**
- Problem: `for (const tableName of tableNames) { rawSamples[tableName] = await getSampleRows(...) }` fetches each table one at a time.
- Files: `server/services/introspection.js` (lines 49–51)
- Cause: Sequential `await` inside a for-of loop.
- Improvement path: Refactor `getSampleRows` to accept an allowed-tables parameter then replace the loop with `Promise.all`.

**Schema context file read from disk on every chat request:**
- Problem: `buildInstructions` reads `db-explorer-context.md` from disk on every `/api/chat` call when no partial schema is available.
- Files: `server/services/chat.service.js` (buildInstructions, line 29)
- Cause: No in-memory caching of file content between requests.
- Improvement path: Cache file content after first read; invalidate on snapshot rebuild.

---

## Fragile Areas

**`CopyPre` component uses deep MDAST node path to extract code text:**
- Files: `client/src/components/chat/ChatMessages.jsx` (lines 22, 30–31)
- Why fragile: `node?.children?.[0]?.children?.[0]?.value` relies on the internal node structure produced by `react-markdown`. A version bump that changes node shape silently breaks copy and syntax highlighting with no error.
- Safe modification: Pin `react-markdown` version and add a fallback that reads text content from the rendered DOM if the AST path returns empty.
- Test coverage: None.

**`isFollowUpQuery` heuristic is simplistic and misfires:**
- Files: `server/services/chat.service.js` (lines 44–53)
- Why fragile: Word-list matching (e.g., `'it '` with a trailing space) and a word-count threshold of 3 misclassify queries. A short but independent query like "list cities" (3 words) is treated as a follow-up, injecting wrong table context into the prompt.
- Safe modification: Raise the word-count threshold or replace with a dedicated classification prompt pass.
- Test coverage: None.

**`buildDummyValue` does not handle all patterns that `isLikelyPiiColumn` flags:**
- Files: `server/services/postgres.service.js` (lines 136–164)
- Why fragile: A column named `ssn` passes the PII detection check but has no branch in `buildDummyValue`, so the real value is returned unmasked.
- Safe modification: Add explicit branches for `ssn`, `social_security`, `passport`, `api_key`, and `secret` patterns, or add a final catch-all `return 'redacted'` for unrecognized string columns.
- Test coverage: None.

---

## Test Coverage Gaps

**Zero test files exist in the entire project:**
- What's not tested: All server services, repositories, controllers, middleware, and all client components.
- Files: `server/services/`, `server/repositories/`, `server/middleware/`, `server/controllers/`, `client/src/`
- Risk: Any refactor to core logic (PII masking, SQL generation, session handling, rate limiting) can break silently. The `test` script in `server/package.json` exits with error code 1 (`echo "Error: no test specified" && exit 1`).
- Priority: High for security-sensitive paths (PII masking, rate limiting, session guard).

**PII masking logic has no unit tests:**
- What's not tested: `isLikelyPiiColumn`, `buildDummyValue`, `sanitizeSamples`.
- Files: `server/services/postgres.service.js` (lines 87–195)
- Risk: Regressions in masking silently expose real user data in the AI prompt context.
- Priority: High.

---

## Missing Critical Features

**`requireSession` middleware is never applied:**
- Problem: The session guard exists but protects nothing (see Security Considerations above). All endpoints are effectively public.
- Blocks: Any attempt to restrict the app to authenticated users.

---

*Concerns audit: 2026-03-24*
