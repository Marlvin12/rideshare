import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeFoodTax, FOOD_TAX_RATE } from '../utils/mapUtils.js';

describe('computeFoodTax (BE-13)', () => {
  it('defaults to 0 tax (FOOD_TAX_RATE unset) — preserves prior behaviour', () => {
    assert.strictEqual(FOOD_TAX_RATE, 0);
    assert.strictEqual(computeFoodTax(100), 0);
  });

  it('applies an explicit rate, rounded to 2dp', () => {
    assert.strictEqual(computeFoodTax(100, 0.15), 15);
    assert.strictEqual(computeFoodTax(33.33, 0.15), 5); // 4.9995 -> 5.00
  });

  it('floors negative/NaN subtotal and rate to 0 (tax never negative)', () => {
    assert.strictEqual(computeFoodTax(-100, 0.15), 0);
    assert.strictEqual(computeFoodTax(100, -0.15), 0);
    assert.strictEqual(computeFoodTax(NaN, 0.15), 0);
    assert.strictEqual(computeFoodTax(100, NaN), 0);
  });

  it('handles string-numeric inputs', () => {
    assert.strictEqual(computeFoodTax('50', '0.2'), 10);
  });
});
