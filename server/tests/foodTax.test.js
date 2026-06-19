import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeFoodTax, FOOD_TAX_RATE, sumFoodOrderTotal } from '../utils/mapUtils.js';

const PLATFORM_FEE_RATE = 0.1; // mirrors foodOrder.js

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

describe('sumFoodOrderTotal + refund invariant (BE-13 review)', () => {
  it('sums every breakdown component to 2dp', () => {
    assert.strictEqual(
      sumFoodOrderTotal({ itemsTotal: 20, deliveryFee: 3.5, platformFee: 2, tax: 3 }),
      28.5,
    );
  });

  it('keeps total === itemsTotal + deliveryFee + platformFee + tax after a partial refund (rate set)', () => {
    const rate = 0.15;
    // Initial order: items 100, delivery 5, platform 10, tax 15 -> total 130.
    let pricing = {
      itemsTotal: 100,
      deliveryFee: 5,
      platformFee: computeFoodTax(100, PLATFORM_FEE_RATE), // 10 (reuse rounding)
      tax: computeFoodTax(100, rate), // 15
    };
    pricing.total = sumFoodOrderTotal(pricing);
    assert.strictEqual(pricing.total, 130);

    // Refund a $40 item: mirror the controller's refund recompute.
    pricing.itemsTotal = parseFloat((pricing.itemsTotal - 40).toFixed(2)); // 60
    pricing.platformFee = computeFoodTax(pricing.itemsTotal, PLATFORM_FEE_RATE); // 6
    pricing.tax = computeFoodTax(pricing.itemsTotal, rate); // 9 (recomputed on 60, not stale 15)
    pricing.total = sumFoodOrderTotal(pricing);

    assert.strictEqual(pricing.tax, 9, 'tax recomputed on the reduced subtotal');
    assert.strictEqual(
      pricing.total,
      pricing.itemsTotal + pricing.deliveryFee + pricing.platformFee + pricing.tax,
      'total equals its own breakdown (tax included)',
    );
    assert.strictEqual(pricing.total, 80); // 60 + 5 + 6 + 9
  });
});
