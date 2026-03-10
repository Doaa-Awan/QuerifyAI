import { createHash } from 'node:crypto';

const MAX_ENTRIES = 200;
const store = new Map();

export const queryCache = {
  /**
   * Build a deterministic 16-char hex cache key from a question and a list of table names.
   * @param {string} question
   * @param {string[]} tableNames
   * @returns {string} 16-character hex string
   */
  buildKey(question, tableNames = []) {
    const normalizedQuestion = question.toLowerCase().trim();
    const tableFingerprint =
      tableNames.length === 0
        ? 'no-schema'
        : [...tableNames].sort().join(',');
    const raw = `${normalizedQuestion}|${tableFingerprint}`;
    return createHash('sha256').update(raw).digest('hex').slice(0, 16);
  },

  /**
   * Retrieve a cached value by key.
   * @param {string} key
   * @returns {*} stored value, or null if not found
   */
  get(key) {
    return store.has(key) ? store.get(key) : null;
  },

  /**
   * Store a value. FIFO-evicts the oldest entry when at capacity.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    if (store.size >= MAX_ENTRIES && !store.has(key)) {
      const firstKey = store.keys().next().value;
      store.delete(firstKey);
    }
    store.set(key, value);
  },

  /** Empty the cache entirely. */
  clear() {
    store.clear();
  },

  /** Number of entries currently in the cache. */
  get size() {
    return store.size;
  },
};
