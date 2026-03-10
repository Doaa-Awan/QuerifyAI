import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Stub tests for QAPI-01 and QAPI-02.
// These will be updated with real assertions after Task 2 creates query.controller.js.

describe('POST /api/query', () => {
  it('valid { question, conversationId } returns 200 with { sql, explanation, tablesUsed } shape', () => {
    assert.ok(true); // placeholder
  });

  it('missing question returns 400', () => {
    assert.ok(true); // placeholder
  });

  it('invalid conversationId (not a UUID) returns 400', () => {
    assert.ok(true); // placeholder
  });
});
