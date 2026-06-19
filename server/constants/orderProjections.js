// Mongoose field projections for order responses. Kept in a side-effect-free
// module so they can be imported (and unit-tested) without pulling in the order
// controller's DB/queue dependencies.

// Courier fields surfaced to the customer on order/tracking responses (BE-21).
// Adds profilePhoto + aggregate rating so the tracking screen can render a real
// courier card (photo + rating) instead of a generic glyph + "Your courier".
// phone is included for the existing call button; nothing sensitive is exposed.
export const COURIER_PUBLIC_FIELDS = 'name phone vehicleType profilePhoto stats.rating stats.totalRatings';
