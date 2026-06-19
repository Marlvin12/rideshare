/**
 * Leading-edge throttle with a trailing coalesce.
 *
 * Returns a `schedule()` function: the FIRST call invokes `fn` immediately, and
 * any further calls inside `windowMs` are collapsed into a SINGLE trailing
 * invocation fired when the window closes. So no matter how many times
 * `schedule()` is called, `fn` runs at most ~once per `windowMs`.
 *
 * This is used to coalesce a burst of on-duty rider GPS pings into one
 * nearby-riders broadcast. The previous code ran a global O(customers x riders)
 * fan-out on EVERY ping; throttling caps it to one fan-out per window while
 * still staying current (the trailing call always reflects the latest state).
 *
 * The timer functions are injectable so the behaviour can be unit-tested with
 * mock timers without real delays.
 *
 * @param {() => void} fn         work to run (the broadcast)
 * @param {number} windowMs       minimum gap between invocations
 * @param {object} [opts]
 * @param {typeof setTimeout} [opts.setTimeoutFn]
 * @param {typeof clearTimeout} [opts.clearTimeoutFn]
 * @returns {{ (): void, cancel: () => void }}
 */
export function createCoalescingThrottle(
  fn,
  windowMs,
  { setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout } = {}
) {
  let timer = null;
  let pending = false;

  function schedule() {
    if (timer) {
      // Already inside a window — remember that state changed and coalesce.
      pending = true;
      return;
    }
    fn();
    timer = setTimeoutFn(function onWindowEnd() {
      timer = null;
      if (pending) {
        pending = false;
        schedule();
      }
    }, windowMs);
  }

  schedule.cancel = function cancel() {
    if (timer) {
      clearTimeoutFn(timer);
      timer = null;
    }
    pending = false;
  };

  return schedule;
}
