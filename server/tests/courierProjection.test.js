import { describe, it } from 'node:test';
import assert from 'node:assert';
import { COURIER_PUBLIC_FIELDS } from '../constants/orderProjections.js';

describe('COURIER_PUBLIC_FIELDS (BE-21)', () => {
  const fields = COURIER_PUBLIC_FIELDS.split(/\s+/);

  it('exposes courier photo + aggregate rating for the tracking card', () => {
    assert.ok(fields.includes('profilePhoto'), 'photo for the courier card');
    assert.ok(fields.includes('stats.rating'), 'aggregate rating');
    assert.ok(fields.includes('stats.totalRatings'), 'rating count');
  });

  it('keeps name + phone (call button) and projects the real vehicle sub-doc', () => {
    for (const f of ['name', 'phone', 'vehicle']) {
      assert.ok(fields.includes(f), `retains ${f}`);
    }
    // Guard against regressing to the no-op `vehicleType` (not a model field).
    assert.ok(!fields.includes('vehicleType'), 'must use vehicle, not the no-op vehicleType');
  });

  it('exposes nothing sensitive (no email/firebaseUid/kyc/earnings)', () => {
    for (const f of fields) {
      assert.ok(
        !/email|firebase|kyc|earnings|password|token/i.test(f),
        `field "${f}" must not be sensitive`,
      );
    }
  });
});
