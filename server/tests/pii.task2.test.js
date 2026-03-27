// TDD RED — Task 2: buildDummyValue ssn/dob/passport branches
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDummyValue } from '../services/postgres.service.js';

describe('buildDummyValue — ssn, dob, and passport branches', () => {
  it('integer SSN returns ***-**-****', () => {
    assert.equal(buildDummyValue('ssn', 123456789, 0), '***-**-****');
  });

  it('bigint social_security returns ***-**-****', () => {
    assert.equal(buildDummyValue('social_security', 987654321n, 0), '***-**-****');
  });

  it('string SSN returns ***-**-****', () => {
    assert.equal(buildDummyValue('ssn', '123-45-6789', 0), '***-**-****');
  });

  it('dob date string returns 1900-01-01', () => {
    assert.equal(buildDummyValue('dob', '1985-06-15', 0), '1900-01-01');
  });

  it('birth_date Date object returns 1900-01-01', () => {
    assert.equal(buildDummyValue('birth_date', new Date('1990-01-01'), 0), '1900-01-01');
  });

  it('passport string returns redacted', () => {
    assert.equal(buildDummyValue('passport', 'AB123456', 0), 'redacted');
  });

  it('passport_number string returns redacted', () => {
    assert.equal(buildDummyValue('passport_number', 'XY789', 0), 'redacted');
  });

  it('null email passes through as null', () => {
    assert.equal(buildDummyValue('email', null, 0), null);
  });
});
