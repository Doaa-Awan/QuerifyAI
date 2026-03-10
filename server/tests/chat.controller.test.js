import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Stub test for QAPI-04.
// Will be updated with real assertions after Task 2 adds the deprecation warn.

describe('POST /api/chat deprecation', () => {
  it('calls console.warn with string containing "[/api/chat] Deprecated"', () => {
    assert.ok(true); // placeholder
  });
});
