import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chatController } from '../controllers/chat.controller.js';

describe('POST /api/chat deprecation', () => {
  it('calls console.warn with string containing "[/api/chat] Deprecated"', async () => {
    const warnMessages = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnMessages.push(args.join(' '));

    // Provide a mock req/res that short-circuits after the warn fires
    const req = { body: {} };
    const res = {
      status() { return this; },
      json() {},
    };

    try {
      await chatController.sendMessage(req, res);
    } finally {
      console.warn = originalWarn;
    }

    const warnText = warnMessages.join('\n');
    assert.ok(
      warnText.includes('[/api/chat] Deprecated'),
      `Expected console.warn to include "[/api/chat] Deprecated", got: "${warnText}"`
    );
  });
});
