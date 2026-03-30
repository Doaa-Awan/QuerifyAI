// Unit tests for Phase 3: session flag set in all connect handlers
// Covers AUTH-01 (connectDemo) and AUTH-02 (connect, connectAndIntrospect) for Postgres and MSSQL

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { postgresController } from '../controllers/postgres.controller.js';
import { postgresService } from '../services/postgres.service.js';

import { mssqlController } from '../controllers/mssql.controller.js';
import { mssqlService } from '../services/mssql.service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal mock response object that tracks status code and JSON body.
 * Matches the chainable res.status(N).json(body) pattern used by controllers.
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

/** Minimal mock request with a plain session object. */
function makeMockReq(body = {}) {
  return {
    session: {},
    body,
  };
}

// ---------------------------------------------------------------------------
// postgresController — connectDemo (T1, AUTH-01)
// ---------------------------------------------------------------------------

describe('postgresController.connectDemo', () => {
  let originalConnectDemo;

  beforeEach(() => {
    originalConnectDemo = postgresService.connectDemo;
  });

  afterEach(() => {
    postgresService.connectDemo = originalConnectDemo;
  });

  it('sets req.session.connected = true on success', async () => {
    postgresService.connectDemo = async () => ({ ok: true });

    const req = makeMockReq();
    const res = makeMockRes();

    await postgresController.connectDemo(req, res);

    assert.equal(
      req.session.connected,
      true,
      'session.connected must be true after a successful connectDemo'
    );
  });

  it('sets req.session.connected = false on failure', async () => {
    postgresService.connectDemo = async () => ({
      ok: false,
      status: 503,
      error: 'demo DB unreachable',
    });

    const req = makeMockReq();
    const res = makeMockRes();

    await postgresController.connectDemo(req, res);

    assert.equal(
      req.session.connected,
      false,
      'session.connected must be false after a failed connectDemo'
    );
  });
});

// ---------------------------------------------------------------------------
// postgresController — connect (T2, AUTH-02)
// ---------------------------------------------------------------------------

describe('postgresController.connect', () => {
  let originalConnect;

  // Valid body that satisfies the Zod connectSchema
  const validBody = { host: 'localhost', user: 'admin', database: 'mydb' };

  beforeEach(() => {
    originalConnect = postgresService.connect;
  });

  afterEach(() => {
    postgresService.connect = originalConnect;
  });

  it('sets req.session.connected = true on success', async () => {
    postgresService.connect = async () => ({ ok: true });

    const req = makeMockReq(validBody);
    const res = makeMockRes();

    await postgresController.connect(req, res);

    assert.equal(
      req.session.connected,
      true,
      'session.connected must be true after a successful connect'
    );
  });

  it('sets req.session.connected = false on failure', async () => {
    postgresService.connect = async () => ({
      ok: false,
      status: 500,
      error: 'connection refused',
    });

    const req = makeMockReq(validBody);
    const res = makeMockRes();

    await postgresController.connect(req, res);

    assert.equal(
      req.session.connected,
      false,
      'session.connected must be false after a failed connect'
    );
  });
});

// ---------------------------------------------------------------------------
// postgresController — connectAndIntrospect failure path (T3, AUTH-02)
// ---------------------------------------------------------------------------

describe('postgresController.connectAndIntrospect', () => {
  let originalConnectAndIntrospect;

  const validBody = { host: 'localhost', user: 'admin', database: 'mydb' };

  beforeEach(() => {
    originalConnectAndIntrospect = postgresService.connectAndIntrospect;
  });

  afterEach(() => {
    postgresService.connectAndIntrospect = originalConnectAndIntrospect;
  });

  it('sets req.session.connected = false on failure', async () => {
    postgresService.connectAndIntrospect = async () => ({
      ok: false,
      status: 500,
      error: 'introspection failed',
    });

    const req = makeMockReq(validBody);
    const res = makeMockRes();

    await postgresController.connectAndIntrospect(req, res);

    assert.equal(
      req.session.connected,
      false,
      'session.connected must be false when connectAndIntrospect fails'
    );
  });
});

// ---------------------------------------------------------------------------
// mssqlController — connectDemo (T4, AUTH-01)
// ---------------------------------------------------------------------------

describe('mssqlController.connectDemo', () => {
  let originalConnectDemo;

  beforeEach(() => {
    originalConnectDemo = mssqlService.connectDemo;
  });

  afterEach(() => {
    mssqlService.connectDemo = originalConnectDemo;
  });

  it('sets req.session.connected = true on success', async () => {
    mssqlService.connectDemo = async () => ({ ok: true });

    const req = makeMockReq();
    const res = makeMockRes();

    await mssqlController.connectDemo(req, res);

    assert.equal(
      req.session.connected,
      true,
      'session.connected must be true after a successful mssql connectDemo'
    );
  });

  it('sets req.session.connected = false on failure', async () => {
    mssqlService.connectDemo = async () => ({
      ok: false,
      status: 503,
      error: 'SQL Server demo unreachable',
    });

    const req = makeMockReq();
    const res = makeMockRes();

    await mssqlController.connectDemo(req, res);

    assert.equal(
      req.session.connected,
      false,
      'session.connected must be false after a failed mssql connectDemo'
    );
  });
});

// ---------------------------------------------------------------------------
// mssqlController — connect (T5, AUTH-02)
// ---------------------------------------------------------------------------

describe('mssqlController.connect', () => {
  let originalConnect;

  // Valid body that satisfies the Zod mssql connectSchema
  const validBody = { server: 'localhost', user: 'sa', database: 'mydb' };

  beforeEach(() => {
    originalConnect = mssqlService.connect;
  });

  afterEach(() => {
    mssqlService.connect = originalConnect;
  });

  it('sets req.session.connected = true on success', async () => {
    mssqlService.connect = async () => ({ ok: true });

    const req = makeMockReq(validBody);
    const res = makeMockRes();

    await mssqlController.connect(req, res);

    assert.equal(
      req.session.connected,
      true,
      'session.connected must be true after a successful mssql connect'
    );
  });

  it('sets req.session.connected = false on failure', async () => {
    mssqlService.connect = async () => ({
      ok: false,
      status: 500,
      error: 'TCP connection refused',
    });

    const req = makeMockReq(validBody);
    const res = makeMockRes();

    await mssqlController.connect(req, res);

    assert.equal(
      req.session.connected,
      false,
      'session.connected must be false after a failed mssql connect'
    );
  });
});
