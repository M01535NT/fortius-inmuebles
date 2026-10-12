import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as release from '../../tools/fortius-release-check.mjs';

const sha = 'a'.repeat(40);
const run = (overrides = {}) => ({ id: 1, head_sha: sha, name: 'Verify', path: '.github/workflows/verify.yml', event: 'push', status: 'completed', conclusion: 'success', created_at: '2026-10-12T18:00:00Z', run_attempt: 1, ...overrides });

test('a release requires a successful completed Verify for the exact commit', () => {
  assert.equal(typeof release.checkReleaseRuns, 'function', 'release check must exist');
  assert.equal(release.checkReleaseRuns([], sha).allowed, false);
  assert.equal(release.checkReleaseRuns([run({ head_sha: 'b'.repeat(40) })], sha).allowed, false);
  assert.equal(release.checkReleaseRuns([run()], sha).allowed, true);
});

test('a more recent failure or pending rerun blocks release despite an earlier success', () => {
  assert.equal(typeof release.checkReleaseRuns, 'function', 'release check must exist');
  assert.equal(release.checkReleaseRuns([run(), run({ id: 2, created_at: '2026-10-12T19:00:00Z', conclusion: 'failure' })], sha).allowed, false);
  assert.equal(release.checkReleaseRuns([run(), run({ run_attempt: 2, status: 'in_progress', conclusion: null })], sha).allowed, false);
});

test('other workflows and scheduled maintenance cannot satisfy the release check', () => {
  assert.equal(typeof release.checkReleaseRuns, 'function', 'release check must exist');
  assert.equal(release.checkReleaseRuns([run({ name: 'Financial source maintenance', path: '.github/workflows/financial-sources.yml', event: 'schedule' })], sha).allowed, false);
  assert.equal(release.checkReleaseRuns([run({ event: 'schedule' })], sha).allowed, false);
});
