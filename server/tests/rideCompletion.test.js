import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildRideCompletionInc } from '../utils/rideCompletion.js';

describe('buildRideCompletionInc', () => {
  it('increments completedRides and totalRides by exactly 1', () => {
    const inc = buildRideCompletionInc(10);
    assert.strictEqual(inc['stats.completedRides'], 1);
    assert.strictEqual(inc['stats.totalRides'], 1);
  });

  it('credits the rider share to earnings.total and earnings.available', () => {
    const inc = buildRideCompletionInc(12.5);
    assert.strictEqual(inc['earnings.total'], 12.5);
    assert.strictEqual(inc['earnings.available'], 12.5);
  });

  it('coerces a missing/NaN share to 0 (counters still increment)', () => {
    const inc = buildRideCompletionInc(undefined);
    assert.strictEqual(inc['earnings.total'], 0);
    assert.strictEqual(inc['earnings.available'], 0);
    assert.strictEqual(inc['stats.completedRides'], 1);
    assert.strictEqual(inc['stats.totalRides'], 1);
  });

  it('does not touch cancelledRides (no cancel hook here)', () => {
    const inc = buildRideCompletionInc(5);
    assert.ok(!('stats.cancelledRides' in inc));
  });

  it('returns only the four expected keys', () => {
    assert.deepStrictEqual(
      Object.keys(buildRideCompletionInc(1)).sort(),
      ['earnings.available', 'earnings.total', 'stats.completedRides', 'stats.totalRides'],
    );
  });
});
