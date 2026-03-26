import { describe, test, expect, beforeAll } from '@jest/globals';
import { chatService } from '../services/chat.service.js';
import { postgresService } from '../services/postgres.service.js';

const PRICE_INPUT  = 0.15;
const PRICE_OUTPUT = 0.60;
function calcCost(input, output) {
  return (input * PRICE_INPUT + output * PRICE_OUTPUT) / 1_000_000;
}

function printMetrics(label, result) {
  const t = result.tokens ?? {};
  const cost = calcCost(t.input ?? 0, t.output ?? 0);
  console.table({
    prompt:        label,
    sql_generated: result.sql ? 'YES' : 'NO',
    tables_used:   result.tables_used.join(', '),
    tables_cached: result.tables_cached.join(', ') || '(none)',
    pii_masked:    result.pii_columns_masked.join(', ') || '(none)',
    tokens_input:  t.input ?? 0,
    tokens_output: t.output ?? 0,
    tokens_total:  t.total ?? result.token_count ?? 0,
    cost_usd:      `$${cost.toFixed(6)}`,
    pass1_tokens:  t.pass1?.total ?? 0,
    pass2_tokens:  t.pass2?.total ?? 0,
  });
}

beforeAll(async () => {
  const conn = await postgresService.connectDemo();
  if (!conn.ok) throw new Error(`Demo DB connection failed: ${conn.error}`);
  const snap = await postgresService.buildExplorerSnapshot();
  if (!snap.ok) throw new Error(`Snapshot failed: ${snap.error}`);
}, 120_000);

const QUERIES = [
  {
    name: 'SLA open tickets > 30 days',
    prompt: 'Which clients have open tickets older than 30 days that are also on an active SLA contract?',
    expectTables: ['Faults', 'Company'],
  },
  {
    name: 'Time overage by client',
    prompt: 'Show me all tickets where the actual time spent exceeded the budgeted time, grouped by client',
    expectTables: ['Faults', 'FaultBudget'],
  },
  {
    name: 'Devices with >3 tickets in 90 days',
    prompt: 'Which devices have had more than 3 tickets raised against them in the last 90 days?',
    expectTables: ['Faults', 'Device'],
  },
  {
    name: 'Invoices with no closed tickets',
    prompt: 'Find all invoices that have been issued to a client but have no corresponding closed tickets in the same time period',
    expectTables: ['Faults', 'Company'],
  },
  {
    name: 'Top technicians P1 resolution time',
    prompt: 'Which technicians have the highest average ticket resolution time for priority 1 issues this quarter?',
    expectTables: ['Faults'],
  },
];

describe('Chat accuracy — live integration', () => {
  for (const { name, prompt, expectTables } of QUERIES) {
    test(name, async () => {
      const result = await chatService.sendMessage(prompt, crypto.randomUUID(), 'postgresql');
      printMetrics(name, result);

      expect(result.sql).not.toBeNull();
      expect(typeof result.sql).toBe('string');
      expect(result.explanation.length).toBeGreaterThan(0);
      expect(result.token_count).toBeGreaterThan(0);
      expect(result.tables_used).toEqual(expect.arrayContaining(expectTables));
    }, 60_000);
  }
});
