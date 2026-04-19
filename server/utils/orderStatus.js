export const ORDER_STATUS_LIFECYCLE = [
  'pending',
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'courier_searching',
  'courier_assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
];

export const ALLOWED_TRANSITIONS = {
  pending: ['restaurant_accepted', 'cancelled'],
  restaurant_accepted: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'courier_searching', 'cancelled'],
  ready_for_pickup: ['courier_searching', 'cancelled'],
  courier_searching: ['courier_assigned', 'cancelled'],
  courier_assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit'],
  in_transit: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function assertStatusTransition(currentStatus, nextStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} -> ${nextStatus}`);
  }
}
