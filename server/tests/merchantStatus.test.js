import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  RIDESHARE_TO_MERCHANT_STATUS,
  MERCHANT_TO_RIDESHARE_STATUS,
  MERCHANT_ACTIVE_STATUSES,
} from '../constants/merchantStatus.js';
import { ORDER_STATUS_LIFECYCLE } from '../utils/orderStatus.js';

// These cross-checks against the canonical lifecycle would have caught the
// `bidding_open` -> `courier_searching` rename drift that left two stale refs in
// merchantController (a missing mapping and a never-matching filter).
describe('merchant status mapping vs canonical lifecycle', () => {
  it('maps EVERY rideshare lifecycle status (none falls through to undefined)', () => {
    for (const s of ORDER_STATUS_LIFECYCLE) {
      assert.ok(
        RIDESHARE_TO_MERCHANT_STATUS[s],
        `no merchant mapping for lifecycle status "${s}"`,
      );
    }
  });

  it('contains no stale mapped status absent from the lifecycle (e.g. bidding_open)', () => {
    for (const s of Object.keys(RIDESHARE_TO_MERCHANT_STATUS)) {
      assert.ok(ORDER_STATUS_LIFECYCLE.includes(s), `stale mapped status "${s}" not in the lifecycle`);
    }
  });

  it('reverse map targets are all real lifecycle statuses', () => {
    for (const target of Object.values(MERCHANT_TO_RIDESHARE_STATUS)) {
      assert.ok(ORDER_STATUS_LIFECYCLE.includes(target), `reverse-map target "${target}" not in lifecycle`);
    }
  });

  it('active-orders filter lists only real statuses, includes courier_searching, excludes bidding_open', () => {
    for (const s of MERCHANT_ACTIVE_STATUSES) {
      assert.ok(ORDER_STATUS_LIFECYCLE.includes(s), `active status "${s}" not in lifecycle`);
    }
    assert.ok(MERCHANT_ACTIVE_STATUSES.includes('courier_searching'), 'courier_searching must be active-visible');
    assert.ok(!MERCHANT_ACTIVE_STATUSES.includes('bidding_open'), 'no stale bidding_open');
    // terminal/out-for-delivery states are not "active" for the merchant list
    for (const terminal of ['delivered', 'cancelled', 'in_transit']) {
      assert.ok(!MERCHANT_ACTIVE_STATUSES.includes(terminal), `${terminal} should not be in the active list`);
    }
  });
});
