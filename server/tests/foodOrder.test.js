import { describe, it } from 'node:test';
import assert from 'node:assert';
import { assertStatusTransition, ALLOWED_TRANSITIONS, ORDER_STATUS_LIFECYCLE } from '../utils/orderStatus.js';

describe('orderStatus', () => {
  describe('ORDER_STATUS_LIFECYCLE', () => {
    it('includes all expected statuses', () => {
      const expected = [
        'pending', 'restaurant_accepted', 'preparing', 'ready_for_pickup',
        'bidding_open', 'courier_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled',
      ];
      assert.deepStrictEqual(ORDER_STATUS_LIFECYCLE, expected);
    });
  });

  describe('ALLOWED_TRANSITIONS', () => {
    it('has an entry for every lifecycle status', () => {
      for (const status of ORDER_STATUS_LIFECYCLE) {
        assert.ok(Array.isArray(ALLOWED_TRANSITIONS[status]), `missing transitions for ${status}`);
      }
    });

    it('only allows transitions to valid statuses', () => {
      for (const [from, toList] of Object.entries(ALLOWED_TRANSITIONS)) {
        for (const to of toList) {
          assert.ok(ORDER_STATUS_LIFECYCLE.includes(to), `invalid next status ${to} from ${from}`);
        }
      }
    });
  });

  describe('assertStatusTransition', () => {
    it('allows pending -> restaurant_accepted', () => {
      assert.doesNotThrow(() => assertStatusTransition('pending', 'restaurant_accepted'));
    });

    it('allows pending -> cancelled', () => {
      assert.doesNotThrow(() => assertStatusTransition('pending', 'cancelled'));
    });

    it('allows restaurant_accepted -> bidding_open', () => {
      assert.doesNotThrow(() => assertStatusTransition('restaurant_accepted', 'bidding_open'));
    });

    it('allows bidding_open -> courier_assigned', () => {
      assert.doesNotThrow(() => assertStatusTransition('bidding_open', 'courier_assigned'));
    });

    it('allows courier_assigned -> picked_up', () => {
      assert.doesNotThrow(() => assertStatusTransition('courier_assigned', 'picked_up'));
    });

    it('allows picked_up -> in_transit', () => {
      assert.doesNotThrow(() => assertStatusTransition('picked_up', 'in_transit'));
    });

    it('allows in_transit -> delivered', () => {
      assert.doesNotThrow(() => assertStatusTransition('in_transit', 'delivered'));
    });

    it('throws for pending -> delivered', () => {
      assert.throws(
        () => assertStatusTransition('pending', 'delivered'),
        /Invalid status transition: pending -> delivered/
      );
    });

    it('throws for delivered -> in_transit', () => {
      assert.throws(
        () => assertStatusTransition('delivered', 'in_transit'),
        /Invalid status transition: delivered -> in_transit/
      );
    });

    it('throws for cancelled -> pending', () => {
      assert.throws(
        () => assertStatusTransition('cancelled', 'pending'),
        /Invalid status transition: cancelled -> pending/
      );
    });

    it('throws for in_transit -> cancelled', () => {
      assert.throws(
        () => assertStatusTransition('in_transit', 'cancelled'),
        /Invalid status transition: in_transit -> cancelled/
      );
    });

    it('throws for unknown current status', () => {
      assert.throws(
        () => assertStatusTransition('unknown', 'pending'),
        /Invalid status transition/
      );
    });
  });
});
