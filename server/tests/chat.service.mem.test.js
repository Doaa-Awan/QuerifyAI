// Unit test for MEM-01: topicCache FIFO eviction cap at 100 entries
// Tests the FIFO pattern used in chat.service.js in isolation.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Standalone helper that mirrors the FIFO guard used in chat.service.js.
// This validates the pattern without requiring the private Map to be exported.
function fifoSet(map, key, value, maxSize) {
  if (map.size >= maxSize) {
    map.delete(map.keys().next().value);
  }
  map.set(key, value);
}

describe('topicCache FIFO eviction (MEM-01)', () => {
  it('fifoSet() keeps Map size at or below maxSize', () => {
    const m = new Map();
    const MAX = 100;
    for (let i = 0; i < 101; i++) {
      fifoSet(m, `conv-${i}`, { tables: [`table${i}`] }, MAX);
    }
    assert.equal(m.size, MAX, `Map size should be exactly ${MAX} after 101 insertions`);
  });

  it('101st entry is present; 1st entry (oldest) is evicted', () => {
    const m = new Map();
    const MAX = 100;
    for (let i = 0; i < 101; i++) {
      fifoSet(m, `conv-${i}`, { tables: [`table${i}`] }, MAX);
    }
    assert.ok(m.has('conv-100'), '101st entry (conv-100) should be present');
    assert.ok(!m.has('conv-0'), '1st entry (conv-0) should have been evicted');
  });

  it('entries 1–100 remain after inserting 101st', () => {
    const m = new Map();
    const MAX = 100;
    for (let i = 0; i < 101; i++) {
      fifoSet(m, `conv-${i}`, { tables: [`table${i}`] }, MAX);
    }
    // conv-1 through conv-100 should remain
    for (let i = 1; i <= 100; i++) {
      assert.ok(m.has(`conv-${i}`), `conv-${i} should still be present`);
    }
  });

  it('exactly at maxSize does not evict', () => {
    const m = new Map();
    const MAX = 5;
    for (let i = 0; i < MAX; i++) {
      fifoSet(m, `k${i}`, i, MAX);
    }
    assert.equal(m.size, MAX);
    // All keys still present
    for (let i = 0; i < MAX; i++) {
      assert.ok(m.has(`k${i}`));
    }
  });

  it('fifoSet() preserves the newest value for same key', () => {
    const m = new Map();
    const MAX = 3;
    fifoSet(m, 'a', 1, MAX);
    fifoSet(m, 'b', 2, MAX);
    fifoSet(m, 'c', 3, MAX);
    // Update existing key 'a' — size stays at 3, 'a' gets new value
    fifoSet(m, 'a', 99, MAX);
    assert.equal(m.size, MAX);
    assert.equal(m.get('a'), 99);
  });
});
