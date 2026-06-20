import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computePromoDiscount } from '../controllers/promotions.js';
import { sumFoodOrderTotal } from '../utils/mapUtils.js';

describe('computePromoDiscount (BE-24)', () => {
  it('applies a percentage discount', () => {
    assert.strictEqual(computePromoDiscount({ discountType: 'percentage', discountValue: 20 }, 50), 10);
  });

  it('caps a percentage discount at maxDiscount', () => {
    assert.strictEqual(
      computePromoDiscount({ discountType: 'percentage', discountValue: 50, maxDiscount: 5 }, 100),
      5,
    );
  });

  it('applies a fixed discount', () => {
    assert.strictEqual(computePromoDiscount({ discountType: 'fixed', discountValue: 7 }, 50), 7);
  });

  it('never exceeds the subtotal', () => {
    assert.strictEqual(computePromoDiscount({ discountType: 'fixed', discountValue: 100 }, 30), 30);
  });

  it('rounds to 2dp and floors at 0', () => {
    assert.strictEqual(computePromoDiscount({ discountType: 'percentage', discountValue: 33.33 }, 10), 3.33);
    assert.strictEqual(computePromoDiscount({ discountType: 'fixed', discountValue: -5 }, 30), 0);
  });
});

describe('sumFoodOrderTotal with discount (BE-24)', () => {
  it('subtracts the discount from the grand total', () => {
    const base = { itemsTotal: 20, deliveryFee: 3, platformFee: 2, tax: 0, tip: 0 };
    assert.strictEqual(sumFoodOrderTotal(base), 25);
    assert.strictEqual(sumFoodOrderTotal({ ...base, discount: 5 }), 20);
  });

  it('floors the total at 0 and ignores a negative discount', () => {
    assert.strictEqual(sumFoodOrderTotal({ itemsTotal: 5, discount: 100 }), 0);
    assert.strictEqual(sumFoodOrderTotal({ itemsTotal: 10, discount: -5 }), 10);
  });

  it('no discount preserves prior behaviour (BE-13/20 invariant intact)', () => {
    assert.strictEqual(sumFoodOrderTotal({ itemsTotal: 10, deliveryFee: 2, tax: 1, tip: 1 }), 14);
  });
});
