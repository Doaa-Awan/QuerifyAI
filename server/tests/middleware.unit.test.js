import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from 'express-rate-limit';
import { requireSession } from '../middleware/requireSession.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal mock response object for requireSession tests.
 * Tracks status code and JSON body via closures.
 */
function makeMockRes() {
  const res = {
    _status: null,
    _body: null,
    statusCalled: false,
    jsonCalled: false,
    status(code) {
      res._status = code;
      res.statusCalled = true;
      return {
        json(body) {
          res._body = body;
          res.jsonCalled = true;
        },
      };
    },
    json(body) {
      res._body = body;
      res.jsonCalled = true;
    },
  };
  return res;
}

/**
 * Minimal mock response for rate-limiter tests.
 * express-rate-limit v8 calls res.setHeader / res.getHeader / res.removeHeader
 * to write the RateLimit-* headers. We provide no-ops for those.
 */
function makeRateLimitRes() {
  const res = {
    _status: null,
    _body: null,
    statusCalled: false,
    jsonCalled: false,
    _headers: {},
    status(code) {
      res._status = code;
      res.statusCalled = true;
      return {
        json(body) {
          res._body = body;
          res.jsonCalled = true;
        },
      };
    },
    json(body) {
      res._body = body;
      res.jsonCalled = true;
    },
    setHeader(name, val) {
      res._headers[name] = val;
    },
    getHeader(name) {
      return res._headers[name];
    },
    removeHeader(name) {
      delete res._headers[name];
    },
  };
  return res;
}

/**
 * Minimal mock request for rate-limiter tests.
 * express-rate-limit v8 reads req.ip and req.socket.remoteAddress.
 */
function makeRateLimitReq() {
  return {
    ip: '127.0.0.1',
    method: 'POST',
    url: '/db/connect',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    connection: { remoteAddress: '127.0.0.1' },
    app: { get: () => false },
  };
}

/**
 * Create a fresh in-process rate-limiter instance with the same config as
 * connectLimiter in rateLimiter.js but with its own isolated MemoryStore.
 * This avoids cross-test state contamination from the production instance.
 */
function makeTestConnectLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: true,
    message: 'Too many connection attempts. Please try again after 15 minutes.',
    handler(req, res, _next, options) {
      res.status(options.statusCode).json({
        error: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// requireSession tests (TEST-04)
// ---------------------------------------------------------------------------

describe('requireSession', () => {
  it('returns 401 when session is undefined', () => {
    const req = { session: undefined };
    const res = makeMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSession(req, res, next);

    assert.equal(res._status, 401, 'status should be 401');
    assert.equal(nextCalled, false, 'next should NOT be called');
    assert.ok(res._body?.error, 'response body should have an error message');
  });

  it('returns 401 when session.connected is false', () => {
    const req = { session: { connected: false } };
    const res = makeMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSession(req, res, next);

    assert.equal(res._status, 401, 'status should be 401');
    assert.equal(nextCalled, false, 'next should NOT be called');
  });

  it('returns 401 when session.connected is a truthy non-boolean string "true"', () => {
    // The middleware uses strict === true, so "true" must NOT pass
    const req = { session: { connected: 'true' } };
    const res = makeMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSession(req, res, next);

    assert.equal(res._status, 401, 'status should be 401 — strict boolean check required');
    assert.equal(nextCalled, false, 'next should NOT be called for string "true"');
  });

  it('calls next() when session.connected === true', () => {
    const req = { session: { connected: true } };
    const res = makeMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSession(req, res, next);

    assert.equal(nextCalled, true, 'next should be called for connected === true');
    assert.equal(res.statusCalled, false, 'res.status should NOT be called');
  });
});

// ---------------------------------------------------------------------------
// connectLimiter tests (TEST-05)
// ---------------------------------------------------------------------------

describe('connectLimiter', () => {
  // Each describe block gets its own fresh limiter with its own MemoryStore.
  // We create it once in a `before` hook and share it across the two tests
  // so that state from the first test (10 calls) carries into the second test.
  let limiter;

  before(() => {
    limiter = makeTestConnectLimiter();
  });

  it('calls next() for the first 10 requests (within limit)', async () => {
    let nextCount = 0;
    const next = () => { nextCount++; };

    for (let i = 0; i < 10; i++) {
      const req = makeRateLimitReq();
      const res = makeRateLimitRes();
      await limiter(req, res, next);
    }

    assert.equal(nextCount, 10, 'next should be called for all 10 requests within limit');
  });

  it('returns 429 on the 11th request (limit exceeded)', async () => {
    // Limiter state continues from the previous test (10 calls already made)
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const req = makeRateLimitReq();
    const res = makeRateLimitRes();
    await limiter(req, res, next);

    assert.equal(nextCalled, false, 'next should NOT be called after limit is exceeded');
    assert.equal(res._status, 429, 'status should be 429 on the 11th request');
    assert.ok(res._body?.error, 'response body should have an error message');
    assert.equal(res._body?.retryAfter, 900, 'retryAfter should be 900 seconds (15 minutes)');
  });
});
