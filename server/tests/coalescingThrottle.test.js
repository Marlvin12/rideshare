import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createCoalescingThrottle } from '../utils/coalescingThrottle.js';

describe('createCoalescingThrottle', () => {
  beforeEach(() => mock.timers.enable({ apis: ['setTimeout'] }));
  afterEach(() => mock.timers.reset());

  it('invokes immediately on the first call (leading edge)', () => {
    let calls = 0;
    const schedule = createCoalescingThrottle(() => calls++, 2000);
    schedule();
    assert.strictEqual(calls, 1);
  });

  it('coalesces a burst within the window into ONE trailing call', () => {
    let calls = 0;
    const schedule = createCoalescingThrottle(() => calls++, 2000);
    schedule();                 // leading -> 1
    schedule(); schedule(); schedule(); // inside window -> pending only
    assert.strictEqual(calls, 1, 'no extra calls inside the window');
    mock.timers.tick(2000);     // window closes -> single trailing -> 2
    assert.strictEqual(calls, 2);
  });

  it('does not fire a trailing call when nothing happened during the window', () => {
    let calls = 0;
    const schedule = createCoalescingThrottle(() => calls++, 2000);
    schedule();                 // 1
    mock.timers.tick(2000);     // no pending work -> stays 1
    assert.strictEqual(calls, 1);
  });

  it('caps invocations far below the number of schedule() calls under load', () => {
    let calls = 0;
    const schedule = createCoalescingThrottle(() => calls++, 1000);
    // 150 rapid "pings" spread across 3 windows.
    for (let w = 0; w < 3; w++) {
      for (let i = 0; i < 50; i++) schedule();
      mock.timers.tick(1000);
    }
    mock.timers.tick(1000);
    assert.ok(calls <= 6, `expected <= 6 broadcasts for 150 pings, got ${calls}`);
    assert.ok(calls >= 1, 'at least the leading call must fire');
  });

  it('cancel() drops pending trailing work', () => {
    let calls = 0;
    const schedule = createCoalescingThrottle(() => calls++, 1000);
    schedule();                 // leading -> 1
    schedule();                 // pending
    schedule.cancel();
    mock.timers.tick(1000);
    assert.strictEqual(calls, 1, 'pending trailing call was cancelled');
  });
});
