// Status mappings between the rideshare order lifecycle and the merchant app's
// vocabulary. Kept in a side-effect-free module so a test can cross-check them
// against the canonical ORDER_STATUS_LIFECYCLE — a guard against rename drift,
// which is exactly how `bidding_open` (renamed to `courier_searching`) was left
// stale here: the map missed `courier_searching` (so those orders mapped to
// undefined) and the active-orders filter listed the never-matching `bidding_open`
// (so courier-searching orders silently dropped out of the merchant list).

// rideshare order status -> status shown in the merchant app.
export const RIDESHARE_TO_MERCHANT_STATUS = {
  pending: 'pending',
  restaurant_accepted: 'confirmed',
  preparing: 'preparing',
  ready_for_pickup: 'ready_for_pickup',
  courier_searching: 'ready_for_pickup',
  courier_assigned: 'courier_assigned',
  picked_up: 'picked_up',
  in_transit: 'in_transit',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

// merchant-settable status -> rideshare status (only the statuses a merchant
// can drive; the rest are system-driven).
export const MERCHANT_TO_RIDESHARE_STATUS = {
  confirmed: 'restaurant_accepted',
  preparing: 'preparing',
  ready_for_pickup: 'ready_for_pickup',
  cancelled: 'cancelled',
};

// The "active" rideshare statuses the merchant's default order list shows:
// everything up to and including the courier-search phase (pre-assignment),
// not yet out for delivery and not terminal.
export const MERCHANT_ACTIVE_STATUSES = [
  'pending',
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'courier_searching',
];
