import { describe, it } from 'node:test';
import assert from 'node:assert';
import { attachRedisAdapter } from '../config/socketAdapter.js';

const noopLog = { info() {}, warn() {}, error() {} };

describe('attachRedisAdapter', () => {
  it('returns false and never calls io.adapter when Redis is unavailable', () => {
    let adapterCalled = false;
    const io = { adapter: () => { adapterCalled = true; } };
    const result = attachRedisAdapter(io, {
      getConnection: () => null,
      makeAdapter: () => ({}),
      log: noopLog,
    });
    assert.strictEqual(result, false);
    assert.strictEqual(adapterCalled, false);
  });

  it('attaches the adapter with the pub client and a DUPLICATED sub client', () => {
    const subClient = { id: 'sub' };
    const pubClient = { id: 'pub', duplicate: () => subClient };
    let passedPub, passedSub, adapterArg;
    const io = { adapter: (a) => { adapterArg = a; } };
    const makeAdapter = (p, s) => { passedPub = p; passedSub = s; return 'ADAPTER'; };

    const result = attachRedisAdapter(io, {
      getConnection: () => pubClient,
      makeAdapter,
      log: noopLog,
    });

    assert.strictEqual(result, true);
    assert.strictEqual(passedPub, pubClient, 'pub client is the shared connection');
    assert.strictEqual(passedSub, subClient, 'sub client is a dedicated duplicate');
    assert.strictEqual(adapterArg, 'ADAPTER');
  });

  it('returns false and never throws if wiring errors', () => {
    const pubClient = { duplicate: () => { throw new Error('boom'); } };
    let adapterCalled = false;
    const io = { adapter: () => { adapterCalled = true; } };
    const result = attachRedisAdapter(io, {
      getConnection: () => pubClient,
      makeAdapter: () => ({}),
      log: noopLog,
    });
    assert.strictEqual(result, false);
    assert.strictEqual(adapterCalled, false);
  });
});
