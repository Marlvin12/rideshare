import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as mapUtils from '../utils/mapUtils.js';

describe('mapUtils surge removal (BE-16)', () => {
  it('no longer exports the dead calculateSurgeMultiplier', () => {
    assert.strictEqual(mapUtils.calculateSurgeMultiplier, undefined);
  });

  it('calculateFare still returns positive per-vehicle fares', () => {
    const f = mapUtils.calculateFare(5);
    for (const v of ['bike', 'human', 'cabEconomy', 'cabPremium']) {
      assert.ok(typeof f[v] === 'number' && f[v] > 0, `${v} fare should be > 0, got ${f[v]}`);
    }
  });

  it('default fare equals explicit surgeMultiplier 1.0 (no behavior change)', () => {
    assert.deepStrictEqual(mapUtils.calculateFare(7), mapUtils.calculateFare(7, 1.0));
    assert.strictEqual(mapUtils.calculateFare(7).surgeMultiplier, 1.0);
  });
});
