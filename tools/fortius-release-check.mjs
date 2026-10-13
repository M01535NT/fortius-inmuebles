// Read-only release preflight; never deploys or changes provider settings.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const exec = promisify(execFile);
export function checkReleaseRuns(runs, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha) || !Array.isArray(runs)) return { allowed: false, reason: 'invalid-metadata' };
  const candidates = runs.filter(run => run.head_sha === sha && run.name === 'Verify'
    && run.path === '.github/workflows/verify.yml' && ['push', 'pull_request'].includes(run.event));
  if (!candidates.length) return { allowed: false, reason: 'no-exact-verification' };
  if (candidates.some(run => !Number.isSafeInteger(run.id) || !Number.isFinite(Date.parse(run.created_at))
    || !Number.isInteger(run.run_attempt) || run.run_attempt < 1
    || (run.run_attempt > 1 && !run.run_started_at && !run.updated_at)
    || [run.run_started_at, run.updated_at].some(value => value != null && !Number.isFinite(Date.parse(value))))) return { allowed: false, reason: 'invalid-metadata' };
  // created_at remains the original run time when GitHub reruns an attempt.
  // Use the latest execution activity, including a rerun of an older run ID.
  const executionTime = run => Math.max(...[run.created_at, run.run_started_at, run.updated_at].filter(Boolean).map(Date.parse));
  candidates.sort((a, b) => executionTime(b) - executionTime(a) || b.id - a.id || b.run_attempt - a.run_attempt);
  const latest = candidates[0];
  return { allowed: latest.status === 'completed' && latest.conclusion === 'success',
    reason: latest.status === 'completed' && latest.conclusion === 'success' ? 'verified' : 'verification-pending-or-failed',
    runId: latest.id, attempt: latest.run_attempt };
}

export async function main() {
  const { stdout: dirty } = await exec('git', ['status', '--porcelain']);
  if (dirty.trim()) {
    console.log(JSON.stringify({ allowed: false, reason: 'uncommitted-workspace' }));
    process.exitCode = 1;
    return;
  }
  const { stdout: revision } = await exec('git', ['rev-parse', 'HEAD']);
  const sha = revision.trim();
  if (!/^[a-f0-9]{40}$/.test(sha)) throw Error('Invalid Git revision');
  const { stdout } = await exec('gh', ['api', `repos/M01535NT/fortius-inmuebles/actions/workflows/verify.yml/runs?head_sha=${sha}&per_page=100`]);
  const decision = checkReleaseRuns(JSON.parse(stdout).workflow_runs, sha);
  console.log(JSON.stringify({ ...decision, sha, productionWrites: 0 }));
  process.exitCode = decision.allowed ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => { console.error('Release verification unavailable; preflight denied'); process.exitCode = 1; });
}
