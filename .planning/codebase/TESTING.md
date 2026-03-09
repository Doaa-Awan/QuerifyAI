# Testing Patterns

**Analysis Date:** 2026-03-09

## Test Framework

**Runner:**
- None configured. `server/package.json` has `"test": "echo \"Error: no test specified\" && exit 1"`
- No Jest, Vitest, Mocha, or similar installed in any `devDependencies`

**Assertion Library:**
- None

**Run Commands:**
```bash
npm test   # exits code 1 — "Error: no test specified"
```

**Client:**
- No test framework in `client/package.json`
- No Vitest, Jest, or React Testing Library present

## Test File Organization

**Location:**
- No test files exist anywhere in the codebase
- No `__tests__/`, `test/`, or `spec/` directories
- No `*.test.js`, `*.spec.js`, `*.test.jsx`, or `*.spec.jsx` files

**Naming:**
- Not applicable — no tests exist

## Test Structure

No test patterns are established. The codebase has zero test coverage.

## Mocking

**Framework:** None

No mock infrastructure exists for:
- The OpenAI/OpenRouter API client (`server/services/chat.service.js`, `server/services/postgres.service.js`)
- The `pg` Pool (`server/db/postgres.js`, `server/repositories/postgres.repository.js`)
- File system operations (`fs.readFile`, `fs.writeFile` in services)
- `express-session` sessions

## Fixtures and Factories

**Test Data:**
- No fixtures or factory functions exist

**Location:**
- No `/fixtures`, `/factories`, or `/mocks` directories

## Coverage

**Requirements:** None enforced

**Coverage:** 0% across all code paths

## Test Types

**Unit Tests:** None exist

**Integration Tests:** None exist

**E2E Tests:** Not configured

## What Should Be Tested (Gap Analysis)

**`server/services/postgres.service.js` — PII masking logic:**
- `isLikelyPiiColumn` — pure function; test with column name and value fixtures
- `buildDummyValue` — pure function with many branches; test each column name pattern
- `sanitizeSamples` — already exported; highest-priority starting point

**`server/services/chat.service.js` — topic cache and table selection:**
- `isFollowUpQuery` — pure function; test known follow-up phrases and short queries
- `buildPartialSchemaContext` — pure function; test markdown output shape with fixture metadata

**`server/db/postgres.js` — query safety:**
- `getSampleRows` — validates table name against allowlist; test that invalid names are rejected

**`server/controllers/` — request validation:**
- `chatController.sendMessage` — Zod rejection path (missing prompt, bad UUID)
- `postgresController.connect` — Zod rejection path (missing host/user/database)

**`client/src/components/chat/ChatMessages.jsx` — SQL detection:**
- `isSqlBlock` — pure function; test with SQL and non-SQL code blocks

## Recommended Test Setup

Install Vitest (compatible with Node ES modules without config friction):

```bash
cd server && npm install --save-dev vitest
```

Add to `server/package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

`sanitizeSamples` in `server/services/postgres.service.js` is already exported and is the best first test target — it is pure, has no I/O, and covers the most complex branching logic in the codebase.

For controller tests, use `supertest` alongside Vitest. The Zod validation and session middleware are already cleanly separated, making controller tests straightforward without needing a real database.

---

*Testing analysis: 2026-03-09*
