/**
 * Build the atomic $inc payload applied to the rider's User document when a ride
 * is COMPLETED.
 *
 * Previously only the earnings were incremented, so stats.completedRides /
 * stats.totalRides stayed at 0 forever — every driver's profile card showed
 * "0 completed rides" regardless of how many they'd done (audit BE-8). We bump
 * both counters in the SAME $inc as the earnings so the write stays atomic and
 * can't half-apply.
 *
 * Kept as a tiny pure function (no mongoose/import side effects) so the payload
 * shape is unit-testable without a database.
 *
 * Note: cancelledRides is intentionally not touched here — there is currently no
 * ride-cancellation handler on this controller to hook; when one is added it
 * should bump stats.cancelledRides (and stats.totalRides) on its own path.
 *
 * @param {number} riderShare  the rider's earnings for this ride (>= 0)
 * @returns {Record<string, number>} a mongoose $inc payload
 */
export function buildRideCompletionInc(riderShare) {
  const share = Number(riderShare) || 0;
  return {
    "earnings.total": share,
    "earnings.available": share,
    "stats.completedRides": 1,
    "stats.totalRides": 1,
  };
}
