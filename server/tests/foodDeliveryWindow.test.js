import { describe, it } from 'node:test';
import assert from 'node:assert';
import { estimateFoodDeliveryWindow } from '../utils/mapUtils.js';

const NOW = 1_700_000_000_000; // fixed epoch so assertions are deterministic
const minutesFromNow = (date) => Math.round((date.getTime() - NOW) / 60_000);

describe('estimateFoodDeliveryWindow (BE-6a)', () => {
  it('returns a [min,max] window around the center, max after min', () => {
    const w = estimateFoodDeliveryWindow({
      courierToRestaurantKm: 0,
      restaurantToCustomerKm: 0,
      prepMinutes: 0,
      now: NOW,
    });
    // center = max(0,0) + 0 + handling(5) = 5; window +/-5
    assert.strictEqual(w.centerMinutes, 5);
    assert.ok(w.etaMax.getTime() > w.etaMin.getTime());
    assert.strictEqual(minutesFromNow(w.etaMin), 0);
    assert.strictEqual(minutesFromNow(w.etaMax), 10);
  });

  it('models prep and courier-drive in PARALLEL (max, not sum)', () => {
    // prep 20 min vs courier drive 5km@25kmh = 12 min -> pickup at max(20,12)=20
    // + delivery 5km = 12 min + handling 5 = 37 center
    const w = estimateFoodDeliveryWindow({
      courierToRestaurantKm: 5,
      restaurantToCustomerKm: 5,
      prepMinutes: 20,
      now: NOW,
    });
    assert.strictEqual(w.centerMinutes, 37);
  });

  it('is dominated by courier drive when prep is short', () => {
    // prep 2 vs courier 10km = 24 min -> pickup 24; + delivery 0 + handling 5 = 29
    const w = estimateFoodDeliveryWindow({
      courierToRestaurantKm: 10,
      restaurantToCustomerKm: 0,
      prepMinutes: 2,
      now: NOW,
    });
    assert.strictEqual(w.centerMinutes, 29);
  });

  it('treats null/NaN/negative distances and prep as 0 (no throw)', () => {
    const w = estimateFoodDeliveryWindow({
      courierToRestaurantKm: null,
      restaurantToCustomerKm: undefined,
      prepMinutes: -5,
      now: NOW,
    });
    assert.strictEqual(w.centerMinutes, 5); // only the handling buffer
  });

  it('never produces a negative etaMin', () => {
    const w = estimateFoodDeliveryWindow({ prepMinutes: 0, now: NOW });
    assert.ok(w.etaMin.getTime() >= NOW);
  });

  it('produces a longer ETA than the old flat 30 only when the trip is genuinely long', () => {
    const short = estimateFoodDeliveryWindow({ courierToRestaurantKm: 1, restaurantToCustomerKm: 1, prepMinutes: 10, now: NOW });
    assert.ok(short.centerMinutes < 30, `short trip should beat flat-30, got ${short.centerMinutes}`);
  });
});
