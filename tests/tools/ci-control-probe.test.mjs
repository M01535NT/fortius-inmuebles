// Temporary negative candidate for CI-01. Removed after remote gate evidence.
// Runs against no backend; must never be merged or deployed to production.
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('CI-01 deliberately blocks this preview candidate', () => {
  assert.fail('Controlled negative candidate: Verify must fail and Vercel must retain aliases.');
});
