import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { queryCache } from '../services/cache.js';

describe('queryCache', () => {
  beforeEach(() => {
    queryCache.clear();
  });

  it('get() returns null for unknown key', () => {
    assert.equal(queryCache.get('nonexistent-key'), null);
  });

  it('set() then get() returns stored value', () => {
    queryCache.set('key1', { sql: 'SELECT 1', explanation: 'test', tablesUsed: [] });
    const result = queryCache.get('key1');
    assert.deepEqual(result, { sql: 'SELECT 1', explanation: 'test', tablesUsed: [] });
  });

  it('after 200 set() calls cache stays at 200 (FIFO eviction, newest entry present)', () => {
    for (let i = 0; i < 200; i++) {
      queryCache.set(`key${i}`, { value: i });
    }
    assert.equal(queryCache.size, 200);

    // Adding a 201st entry should evict the first (key0) and keep the newest
    queryCache.set('key200', { value: 200 });
    assert.equal(queryCache.size, 200);
    assert.equal(queryCache.get('key0'), null, 'oldest entry should have been evicted');
    assert.deepEqual(queryCache.get('key200'), { value: 200 }, 'newest entry should be present');
  });

  it('clear() empties the cache (size === 0)', () => {
    queryCache.set('a', 1);
    queryCache.set('b', 2);
    assert.equal(queryCache.size, 2);
    queryCache.clear();
    assert.equal(queryCache.size, 0);
  });

  it('buildKey() returns same 16-char hex for same question/tables (deterministic)', () => {
    const key1 = queryCache.buildKey('How many users?', ['users', 'orders']);
    const key2 = queryCache.buildKey('How many users?', ['users', 'orders']);
    assert.equal(key1, key2);
    assert.equal(typeof key1, 'string');
    assert.equal(key1.length, 16);
    assert.match(key1, /^[0-9a-f]{16}$/);
  });

  it('buildKey() is case- and whitespace-insensitive for question', () => {
    const key1 = queryCache.buildKey('  HOW MANY USERS?  ', ['users']);
    const key2 = queryCache.buildKey('how many users?', ['users']);
    assert.equal(key1, key2);
  });

  it('buildKey() sorts tableNames so order does not matter', () => {
    const key1 = queryCache.buildKey('list all orders', ['orders', 'users']);
    const key2 = queryCache.buildKey('list all orders', ['users', 'orders']);
    assert.equal(key1, key2);
  });

  it('buildKey() uses "no-schema" fallback for empty tableNames', () => {
    const key1 = queryCache.buildKey('test question', []);
    const key2 = queryCache.buildKey('test question', []);
    assert.equal(key1, key2);
    assert.equal(key1.length, 16);
  });
});
