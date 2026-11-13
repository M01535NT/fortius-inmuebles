import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACCESS_EXPECTATIONS, assertIsolatedDatabaseUrl, checkAccess } from '../../tools/fortius-inmuebles-recovery-rehearsal.mjs';

const REF = 'abcdefghijklmnopqrst';
const manifest = { objects: [{ bucket: 'fortius-inmuebles-expedientes', path: 'exp/a.pdf', public: false }] };

test('the owner connection string must belong to the confirmed isolated project, never production', () => {
  assert.throws(() => assertIsolatedDatabaseUrl('postgresql://postgres.qkkirjzhviqwvuqjnmei:x@aws-0-us-east-1.pooler.supabase.com:5432/postgres', REF), /production/);
  assert.throws(() => assertIsolatedDatabaseUrl('postgresql://postgres:x@db.qkkirjzhviqwvuqjnmei.supabase.co:5432/postgres', REF), /production/);
  assert.throws(() => assertIsolatedDatabaseUrl('postgresql://postgres.otherrefotherrefothe:x@aws-0-us-east-1.pooler.supabase.com:5432/postgres', REF), /confirmed target/);
  assert.throws(() => assertIsolatedDatabaseUrl('not a url', REF), /Invalid/);
  assert.equal(assertIsolatedDatabaseUrl(`postgresql://postgres.${REF}:x@aws-0-us-east-1.pooler.supabase.com:5432/postgres`, REF), true);
  assert.equal(assertIsolatedDatabaseUrl(`postgresql://postgres:x@db.${REF}.supabase.co:5432/postgres`, REF), true);
});

function session(visible, { storageLeak = false } = {}) {
  return {
    from: table => ({ select: async () => (visible[table] === 'denied' ? { data: null, error: { code: '42501' } } : { data: Array.from({ length: visible[table] }, (_, i) => ({ id: i })), error: null }) }),
    storage: { from: () => ({ download: async () => (storageLeak ? { data: new Blob(['x']), error: null } : { data: null, error: { message: 'denied' } }) }) },
  };
}

test('access passes only when every identity sees exactly its expected rows and no session downloads private objects', async () => {
  const ok = await checkAccess({ admin: session(ACCESS_EXPECTATIONS.admin), editor: session(ACCESS_EXPECTATIONS.editor), anon: session({ fortius_inmuebles_expedientes: 'denied', fortius_inmuebles_formato_emissions: 'denied', fortius_inmuebles_expediente_archivos: 'denied' }) }, manifest);
  assert.equal(ok.passed, true);
  assert.equal(ok.results.anon.fortius_inmuebles_expedientes.denied, true);
  const leaky = await checkAccess({ editor: session({ ...ACCESS_EXPECTATIONS.editor, fortius_inmuebles_expediente_archivos: 1 }) }, manifest);
  assert.deepEqual(leaky.failures, ['editor:fortius_inmuebles_expediente_archivos expected 0, saw 1']);
  const storage = await checkAccess({ anon: session(ACCESS_EXPECTATIONS.anon, { storageLeak: true }) }, manifest);
  assert.match(storage.failures[0], /direct Storage download/);
});
