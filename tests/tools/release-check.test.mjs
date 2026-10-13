import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
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

test('a later attempt on an older run overrides a newer run whose success came earlier', () => {
  const newerSuccess = run({ id: 2, created_at: '2026-10-12T19:00:00Z', run_started_at: '2026-10-12T19:00:00Z', updated_at: '2026-10-12T19:10:00Z' });
  const rerun = run({ id: 1, run_attempt: 2, run_started_at: '2026-10-12T20:00:00Z', updated_at: '2026-10-12T20:00:00Z', status: 'in_progress', conclusion: null });
  assert.equal(release.checkReleaseRuns([rerun, newerSuccess], sha).allowed, false);
  assert.equal(release.checkReleaseRuns([{ ...rerun, status: 'completed', conclusion: 'failure', updated_at: '2026-10-12T20:10:00Z' }, newerSuccess], sha).allowed, false);
});

test('an unavailable check denies preflight without claiming enforcement at the deployment provider', () => {
  const tool = fileURLToPath(new URL('../../tools/fortius-release-check.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [tool], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /preflight denied/i);
  assert.doesNotMatch(result.stderr, /deployment remains blocked/i);
});
