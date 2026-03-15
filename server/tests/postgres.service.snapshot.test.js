import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'fs';
import {
  clearExplorerSnapshotFile,
  writeExplorerSnapshot,
} from '../services/postgres.service.js';

describe('clearExplorerSnapshotFile()', () => {
  let mkdirSpy, writeFileSpy, unlinkSpy;

  beforeEach(() => {
    mkdirSpy     = mock.method(fs, 'mkdir',     async () => undefined);
    writeFileSpy = mock.method(fs, 'writeFile', async () => undefined);
    unlinkSpy    = mock.method(fs, 'unlink',    async () => undefined);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('writes empty string to db-explorer-context.md', async () => {
    await clearExplorerSnapshotFile();
    assert.equal(writeFileSpy.mock.calls.length, 1);
    const [filePath, content] = writeFileSpy.mock.calls[0].arguments;
    assert.ok(filePath.endsWith('db-explorer-context.md'), `expected .md path, got ${filePath}`);
    assert.equal(content, '');
  });

  it('unlinks table-metadata.json', async () => {
    await clearExplorerSnapshotFile();
    assert.equal(unlinkSpy.mock.calls.length, 1);
    const [filePath] = unlinkSpy.mock.calls[0].arguments;
    assert.ok(filePath.endsWith('table-metadata.json'), `expected .json path, got ${filePath}`);
  });

  it('does not throw when table-metadata.json is missing (ENOENT)', async () => {
    mock.restoreAll();
    mock.method(fs, 'mkdir',     async () => undefined);
    mock.method(fs, 'writeFile', async () => undefined);
    const err = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
    mock.method(fs, 'unlink', async () => { throw err; });
    await assert.doesNotReject(() => clearExplorerSnapshotFile());
  });

  it('does not throw when unlink throws a non-ENOENT error', async () => {
    mock.restoreAll();
    mock.method(fs, 'mkdir',     async () => undefined);
    mock.method(fs, 'writeFile', async () => undefined);
    mock.method(fs, 'unlink', async () => { throw new Error('EPERM: permission denied'); });
    await assert.doesNotReject(() => clearExplorerSnapshotFile());
  });
});

describe('writeExplorerSnapshot()', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('throws when pool.query rejects (error propagates to caller)', async () => {
    const badPool = {
      query: async () => { throw new Error('connection refused'); },
    };
    mock.method(fs, 'mkdir',     async () => undefined);
    mock.method(fs, 'writeFile', async () => undefined);
    mock.method(fs, 'unlink',    async () => undefined);

    await assert.rejects(() => writeExplorerSnapshot(badPool), /connection refused/);
  });
});
