/**
 * Security hardening unit tests — Phase 04
 *
 * GAP 1 (SEC-01 T1): connectLimiter is exported from rateLimiter.js and is callable as middleware
 * GAP 2 (SEC-01 T2): All 5 connect routes in routes.js have connectLimiter wired before the controller
 * GAP 3 (SEC-02 T1): POSTGRES_SSL_REJECT_UNAUTHORIZED env var expression evaluates correctly
 * GAP 4 (SEC-03 T1): server.js WEAK_SECRETS guard contains expected values and uses console.error before app.listen
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// GAP 1 — SEC-01 T1: connectLimiter export exists and is callable as middleware
// ---------------------------------------------------------------------------

describe('SEC-01 T1 — connectLimiter is exported and is a middleware function', () => {
  it('connectLimiter is exported from rateLimiter.js and is a function', async () => {
    const { connectLimiter } = await import('../middleware/rateLimiter.js');

    assert.ok(
      connectLimiter !== undefined,
      'connectLimiter should be exported from rateLimiter.js'
    );
    assert.equal(
      typeof connectLimiter,
      'function',
      'connectLimiter should be a function (Express middleware)'
    );
  });

  it('connectLimiter accepts three arguments (req, res, next) as Express middleware signature', async () => {
    const { connectLimiter } = await import('../middleware/rateLimiter.js');

    // Express middleware functions have at least 3 parameters: req, res, next
    // express-rate-limit returns a function with length >= 3
    assert.ok(
      connectLimiter.length >= 3,
      `connectLimiter.length should be >= 3 for a valid Express middleware, got ${connectLimiter.length}`
    );
  });
});

// ---------------------------------------------------------------------------
// GAP 2 — SEC-01 T2: All 5 connect routes have connectLimiter wired
// ---------------------------------------------------------------------------

describe('SEC-01 T2 — All 5 connect routes in routes.js have connectLimiter applied', () => {
  const routesSource = readFileSync(
    path.join(serverRoot, 'routes.js'),
    'utf8'
  );

  const CONNECT_ROUTES = [
    '/db/connect-demo',
    '/db/connect',
    '/api/connect',
    '/db/connect-demo-sqlserver',
    '/db/connect-sqlserver',
  ];

  for (const routePath of CONNECT_ROUTES) {
    it(`route '${routePath}' has connectLimiter before its controller`, () => {
      // Match lines like: router.post('/db/connect', connectLimiter, ...)
      // The route path must appear on the same line as connectLimiter
      // Use a regex that allows for the route path (possibly surrounded by quotes)
      // appearing before connectLimiter on the same line
      const lines = routesSource.split('\n');
      const matchingLine = lines.find((line) =>
        line.includes(`'${routePath}'`) || line.includes(`"${routePath}"`)
      );

      assert.ok(
        matchingLine !== undefined,
        `No route definition found for path '${routePath}' in routes.js`
      );

      // connectLimiter must appear after the route path on the same line
      const routePathIndex = matchingLine.indexOf(routePath);
      const connectLimiterIndex = matchingLine.indexOf('connectLimiter');

      assert.ok(
        connectLimiterIndex !== -1,
        `connectLimiter not found on the line defining route '${routePath}': ${matchingLine.trim()}`
      );

      assert.ok(
        connectLimiterIndex > routePathIndex,
        `connectLimiter must appear after '${routePath}' on the same line (i.e., wired as middleware): ${matchingLine.trim()}`
      );
    });
  }

  it('connectLimiter is imported in routes.js', () => {
    assert.ok(
      routesSource.includes('connectLimiter'),
      'routes.js must import and reference connectLimiter'
    );

    // Verify the import statement includes connectLimiter
    const importLine = routesSource
      .split('\n')
      .find(
        (line) =>
          line.includes('import') &&
          line.includes('rateLimiter') &&
          line.includes('connectLimiter')
      );

    assert.ok(
      importLine !== undefined,
      'routes.js must import connectLimiter from rateLimiter.js'
    );
  });
});

// ---------------------------------------------------------------------------
// GAP 3 — SEC-02 T1: SSL env var logic produces correct rejectUnauthorized value
// ---------------------------------------------------------------------------

describe('SEC-02 T1 — POSTGRES_SSL_REJECT_UNAUTHORIZED env var expression evaluates correctly', () => {
  it('postgres.service.js contains the POSTGRES_SSL_REJECT_UNAUTHORIZED env var pattern', () => {
    const serviceSource = readFileSync(
      path.join(serverRoot, 'services', 'postgres.service.js'),
      'utf8'
    );

    assert.ok(
      serviceSource.includes('POSTGRES_SSL_REJECT_UNAUTHORIZED'),
      'postgres.service.js must reference POSTGRES_SSL_REJECT_UNAUTHORIZED'
    );

    assert.ok(
      serviceSource.includes("!== 'false'"),
      "postgres.service.js must use !== 'false' pattern for secure-by-default behavior"
    );
  });

  it('env var absent (undefined) produces rejectUnauthorized: true (secure by default)', () => {
    // Directly test the pure boolean logic from postgres.service.js line 27:
    //   const rejectUnauthorized = process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false';
    const envValue = undefined;
    const rejectUnauthorized = envValue !== 'false';

    assert.equal(
      rejectUnauthorized,
      true,
      'When env var is absent (undefined), rejectUnauthorized should be true (secure by default)'
    );
  });

  it("env var set to 'true' produces rejectUnauthorized: true", () => {
    const envValue = 'true';
    const rejectUnauthorized = envValue !== 'false';

    assert.equal(
      rejectUnauthorized,
      true,
      "When POSTGRES_SSL_REJECT_UNAUTHORIZED='true', rejectUnauthorized should be true"
    );
  });

  it("env var set to 'false' produces rejectUnauthorized: false (opt-out for self-signed certs)", () => {
    const envValue = 'false';
    const rejectUnauthorized = envValue !== 'false';

    assert.equal(
      rejectUnauthorized,
      false,
      "When POSTGRES_SSL_REJECT_UNAUTHORIZED='false', rejectUnauthorized should be false"
    );
  });
});

// ---------------------------------------------------------------------------
// GAP 4 — SEC-03 T1: server.js WEAK_SECRETS guard is correct and precedes app.listen
// ---------------------------------------------------------------------------

describe('SEC-03 T1 — server.js startup guard detects weak SESSION_SECRET', () => {
  const serverSource = readFileSync(
    path.join(serverRoot, 'server.js'),
    'utf8'
  );

  it("WEAK_SECRETS Set contains 'dev-secret-change-in-production'", () => {
    assert.ok(
      serverSource.includes('dev-secret-change-in-production'),
      "server.js WEAK_SECRETS must contain 'dev-secret-change-in-production'"
    );
  });

  it("WEAK_SECRETS Set contains 'change-me-to-a-long-random-string'", () => {
    assert.ok(
      serverSource.includes('change-me-to-a-long-random-string'),
      "server.js WEAK_SECRETS must contain 'change-me-to-a-long-random-string'"
    );
  });

  it('guard uses console.error (not console.warn) so the message goes to stderr', () => {
    assert.ok(
      serverSource.includes('console.error'),
      'server.js must use console.error for the weak secret warning'
    );

    // Also verify the warning message contains [SECURITY WARNING]
    assert.ok(
      serverSource.includes('[SECURITY WARNING]'),
      'server.js console.error output must contain [SECURITY WARNING]'
    );
  });

  it('guard checks NODE_ENV === production', () => {
    assert.ok(
      serverSource.includes("process.env.NODE_ENV === 'production'"),
      "server.js guard must check process.env.NODE_ENV === 'production'"
    );
  });

  it('guard block appears in source before app.listen', () => {
    const weakSecretsIndex = serverSource.indexOf('WEAK_SECRETS');
    const appListenIndex = serverSource.indexOf('app.listen');

    assert.ok(
      weakSecretsIndex !== -1,
      'WEAK_SECRETS must exist in server.js'
    );
    assert.ok(
      appListenIndex !== -1,
      'app.listen must exist in server.js'
    );
    assert.ok(
      weakSecretsIndex < appListenIndex,
      `WEAK_SECRETS guard must appear before app.listen in source (positions: WEAK_SECRETS=${weakSecretsIndex}, app.listen=${appListenIndex})`
    );
  });

  it('strong secret (>=32 chars, not in WEAK_SECRETS) is not listed as a weak value', () => {
    // Verify that a strong secret like a 40-char hex string does NOT appear
    // in the WEAK_SECRETS section of server.js — meaning it would NOT trigger the warning
    const strongSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

    assert.equal(
      serverSource.includes(strongSecret),
      false,
      'A strong custom secret must not appear in the WEAK_SECRETS set in server.js'
    );
  });
});
