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

  it('keeps the existing fields (name, phone for call, vehicleType)', () => {
    for (const f of ['name', 'phone', 'vehicleType']) {
      assert.ok(fields.includes(f), `retains ${f}`);
    }
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
