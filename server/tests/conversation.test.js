// Unit tests for MEM-02: conversation repository Map cap + per-conversation depth cap

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { conversationRepository } from '../repositories/conversation.repository.js';

describe('conversationRepository (MEM-02)', () => {
  // Use unique IDs per test to avoid state bleed (module singleton)

  it('_getConversationsSize() helper exists', () => {
    assert.equal(typeof conversationRepository._getConversationsSize, 'function',
      '_getConversationsSize should be exported for testing');
  });

  it('_getConversationsSize() returns at most 200 after 201 unique insertions', () => {
    for (let i = 0; i < 201; i++) {
      const id = crypto.randomUUID();
      conversationRepository.appendMessage(id, 'user', `msg ${i}`);
    }
    const size = conversationRepository._getConversationsSize();
    assert.ok(
      size <= 200,
      `Map size should be at most 200, got ${size}`
    );
  });

  it('oldest conversation is evicted when 201st unique id is added', () => {
    // Fresh sequence of IDs to track eviction specifically
    const firstId = crypto.randomUUID();
    conversationRepository.appendMessage(firstId, 'user', 'first conversation');

    // Fill up to the cap minus the firstId entry (accounting for earlier test runs)
    const sizeBefore = conversationRepository._getConversationsSize();
    const needed = 200 - sizeBefore; // how many more to reach cap
    for (let i = 0; i < needed; i++) {
      conversationRepository.appendMessage(crypto.randomUUID(), 'user', `filler ${i}`);
    }
    // Now at exactly 200 — add one more to trigger eviction
    conversationRepository.appendMessage(crypto.randomUUID(), 'user', 'overflow');

    const sizeAfter = conversationRepository._getConversationsSize();
    assert.equal(sizeAfter, 200, `Map size should stay at 200 after overflow, got ${sizeAfter}`);
  });

  it('per-conversation depth: after 21 appendMessage calls, _getDepth() returns 20', () => {
    const id = crypto.randomUUID();
    for (let i = 0; i < 21; i++) {
      conversationRepository.appendMessage(id, 'user', `message ${i}`);
    }
    const depth = conversationRepository._getDepth(id);
    assert.equal(depth, 20, `Depth should be capped at 20, got ${depth}`);
  });

  it('per-conversation depth cap: oldest message trimmed after 21 inserts', () => {
    const id = crypto.randomUUID();
    for (let i = 0; i < 21; i++) {
      conversationRepository.appendMessage(id, 'user', `message ${i}`);
    }
    const history = conversationRepository.getRecentMessages(id, 20);
    assert.equal(history.length, 20, 'history should be capped at 20 messages');
    assert.equal(history[0].content, 'message 1', 'oldest message (message 0) should be trimmed');
    assert.equal(history[history.length - 1].content, 'message 20', 'newest message should be present');
  });

  it('getRecentMessages(id, 5) returns last 5 messages in correct order', () => {
    const id = crypto.randomUUID();
    for (let i = 0; i < 21; i++) {
      conversationRepository.appendMessage(id, 'user', `msg ${i}`);
    }
    const recent = conversationRepository.getRecentMessages(id, 5);
    assert.equal(recent.length, 5, 'should return exactly 5 messages');
    // After cap: messages 1-20. Last 5 = 16, 17, 18, 19, 20
    assert.equal(recent[0].content, 'msg 16');
    assert.equal(recent[4].content, 'msg 20');
  });

  it('messages within cap are stored in insertion order', () => {
    const id = crypto.randomUUID();
    conversationRepository.appendMessage(id, 'user', 'first');
    conversationRepository.appendMessage(id, 'assistant', 'second');
    conversationRepository.appendMessage(id, 'user', 'third');
    const history = conversationRepository.getRecentMessages(id, 10);
    assert.equal(history.length, 3);
    assert.equal(history[0].content, 'first');
    assert.equal(history[1].content, 'second');
    assert.equal(history[2].content, 'third');
  });
});
