import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeTip,
  sumFoodOrderTotal,
  computeCourierDeliveryEarnings,
  MAX_FOOD_TIP,
} from '../utils/mapUtils.js';

describe('normalizeTip (BE-20)', () => {
  it('defaults absent/zero/negative/NaN tips to 0', () => {
    assert.strictEqual(normalizeTip(undefined), 0);
    assert.strictEqual(normalizeTip(0), 0);
    assert.strictEqual(normalizeTip(-5), 0);
    assert.strictEqual(normalizeTip(NaN), 0);
    assert.strictEqual(normalizeTip('not a number'), 0);
  });

  it('accepts a valid tip rounded to 2dp', () => {
    assert.strictEqual(normalizeTip(3), 3);
    assert.strictEqual(normalizeTip('2.5'), 2.5);
    assert.strictEqual(normalizeTip(1.999), 2);
  });

  it('clamps to MAX_FOOD_TIP', () => {
    assert.strictEqual(normalizeTip(MAX_FOOD_TIP + 50), MAX_FOOD_TIP);
  });
});

describe('tip folded into the total', () => {
  it('adds tip to the grand total', () => {
    const base = { itemsTotal: 20, deliveryFee: 3, platformFee: 2, tax: 0 };
    assert.strictEqual(sumFoodOrderTotal(base), 25);
    assert.strictEqual(sumFoodOrderTotal({ ...base, tip: 4 }), 29);
  });
});

describe('computeCourierDeliveryEarnings (BE-20)', () => {
  it('passes 100% of the tip on top of the delivery-fee cut', () => {
    // courierShare 5 * 0.8 = 4, + tip 3 = 7
    assert.strictEqual(
      computeCourierDeliveryEarnings({ courierShare: 5, tip: 3 }),
      7,
    );
  });

  it('preserves the prior behaviour with no tip', () => {
    assert.strictEqual(computeCourierDeliveryEarnings({ courierShare: 5 }), 4);
  });

  it('falls back to deliveryFee when courierShare is 0/absent', () => {
    assert.strictEqual(computeCourierDeliveryEarnings({ deliveryFee: 5, tip: 2 }), 6); // 4 + 2
  });

  it('never adds a negative tip', () => {
    assert.strictEqual(computeCourierDeliveryEarnings({ courierShare: 5, tip: -10 }), 4);
  });
});
