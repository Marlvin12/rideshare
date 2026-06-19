import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisConnection } from './redis.js';
import logger from './logger.js';

/**
 * Attach the Socket.IO Redis adapter so `io.to(room).emit(...)` fans out across
 * ALL server instances instead of only the sockets connected to this process.
 *
 * Without it, a ride offer (or its withdrawal) emitted from instance A never
 * reaches a rider whose socket lives on instance B — they silently miss it. The
 * app currently runs on a single Render instance, so the bug is latent; this is
 * the prerequisite for ever scaling horizontally (audit BE-2).
 *
 * Degrades gracefully: if Redis is unavailable (e.g. local dev without redis),
 * it logs and returns false, and Socket.IO keeps working in single-instance
 * (in-process) mode. Never throws — a broken adapter must not take down the app.
 *
 * The pub client is the shared app Redis connection; the sub client MUST be a
 * dedicated connection (a Redis subscriber can't issue normal commands), hence
 * `.duplicate()`.
 *
 * Dependencies are injectable so the wiring can be unit-tested without Redis.
 *
 * Note: this fixes cross-instance message DELIVERY. The nearby-riders LIST is
 * still computed from the per-process in-memory `onDutyRiders` map in
 * controllers/sockets.js; sharing that state across instances is tracked
 * separately (BE-2b).
 *
 * @returns {boolean} true if the adapter was attached, false if degraded.
 */
export function attachRedisAdapter(io, deps = {}) {
  const {
    getConnection = getRedisConnection,
    makeAdapter = createAdapter,
    log = logger,
  } = deps;

  try {
    const pubClient = getConnection();
    if (!pubClient) {
      log.warn('Redis unavailable — Socket.IO running without cross-instance adapter (single-instance fan-out only)');
      return false;
    }
    const subClient = pubClient.duplicate();
    io.adapter(makeAdapter(pubClient, subClient));
    log.info('Socket.IO Redis adapter enabled (cross-instance fan-out)');
    return true;
  } catch (err) {
    log.warn(
      { err: err?.message },
      'Failed to enable Socket.IO Redis adapter; continuing with single-instance fan-out only'
    );
    return false;
  }
}
