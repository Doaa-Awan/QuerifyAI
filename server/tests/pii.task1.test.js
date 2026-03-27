// TDD RED — Task 1: isLikelyPiiColumn guard order
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLikelyPiiColumn } from '../services/postgres.service.js';

describe('isLikelyPiiColumn — date-type guard ordering', () => {
  it('dob with data_type=date is flagged as PII (dob is PII even if stored as date)', () => {
    assert.equal(isLikelyPiiColumn({ data_type: 'date' }, 'dob', null), true);
  });

  it('birth_date with data_type=date is flagged as PII', () => {
    assert.equal(isLikelyPiiColumn({ data_type: 'date' }, 'birth_date', null), true);
  });

  it('created_at with data_type=date is NOT flagged as PII', () => {
    assert.equal(isLikelyPiiColumn({ data_type: 'date' }, 'created_at', null), false);
  });

  it('primary key ssn is NOT flagged (primary key guard wins)', () => {
    assert.equal(isLikelyPiiColumn({ is_primary: true }, 'ssn', '123'), false);
  });

  it('ssn with data_type=integer is flagged as PII', () => {
    assert.equal(isLikelyPiiColumn({ data_type: 'integer' }, 'ssn', 123), true);
  });

  it('passport with data_type=text is flagged as PII', () => {
    assert.equal(isLikelyPiiColumn({ data_type: 'text' }, 'passport', 'AB1234'), true);
  });

  it('updated_at with data_type=timestamp is NOT flagged as PII', () => {
    assert.equal(isLikelyPiiColumn({ data_type: 'timestamp' }, 'updated_at', null), false);
  });
});
