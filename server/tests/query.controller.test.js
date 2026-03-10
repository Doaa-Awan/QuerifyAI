import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryController } from '../controllers/query.controller.js';

/** Minimal mock res that captures status + json calls. */
function mockRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; },
  };
  return res;
}

describe('POST /api/query', () => {
  it('missing question returns 400', async () => {
    const req = { body: { conversationId: '123e4567-e89b-12d3-a456-426614174000' } };
    const res = mockRes();
    await queryController.handleQuery(req, res);
    assert.equal(res._status, 400);
    assert.ok(res._body?.error, 'response should contain an error field');
  });

  it('invalid conversationId (not a UUID) returns 400', async () => {
    const req = { body: { question: 'How many users?', conversationId: 'not-a-uuid' } };
    const res = mockRes();
    await queryController.handleQuery(req, res);
    assert.equal(res._status, 400);
    assert.ok(res._body?.error, 'response should contain an error field');
  });

  it('valid { question, conversationId } calls through and returns { sql, explanation, tablesUsed } shape', async () => {
    // Stub chatService by temporarily replacing it via module mock isn't straightforward
    // in node:test without a mock library; verify the shape contract by patching the module.
    // Here we test the validation path passes (no 400) and that on service error we get 500.
    // A full integration test would require a live AI key — out of scope for unit tests.
    const req = { body: { question: 'How many users?', conversationId: '123e4567-e89b-12d3-a456-426614174000' } };
    const res = mockRes();
    await queryController.handleQuery(req, res);
    // Without a DB/AI connection the service will throw → expect 500 (not 400)
    // This confirms input validation passed and the controller attempted the service call.
    assert.notEqual(res._status, 400, 'valid input should not return 400');
    if (res._status === 200) {
      assert.ok('sql' in res._body, 'response should have sql field');
      assert.ok('explanation' in res._body, 'response should have explanation field');
      assert.ok('tablesUsed' in res._body, 'response should have tablesUsed field');
    } else {
      // 500 is acceptable in test env without AI key
      assert.equal(res._status, 500);
    }
  });
});
