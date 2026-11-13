import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRehearsalDatabase, rehearseCurrent } from '../../tools/fortius-inmuebles-restore-current.mjs';
import { databaseSsl, exportOwner } from '../../tools/fortius-inmuebles-owner-export.mjs';

test('exports every current table in one read-only snapshot that the rehearsal accepts', async () => {
  const db = await createRehearsalDatabase();
  try {
    await db.exec(`insert into auth.users values ('51000000-0000-4000-8000-000000000001');
      insert into public.fortius_inmuebles_staff(user_id,role) values ('51000000-0000-4000-8000-000000000001','admin');`);
    const statements = [];
    const spy = { query: (sql, params) => { statements.push(sql.split('\n')[0]); return db.query(sql, params); } };
    const backup = await exportOwner(spy);
    assert.equal(statements[0], 'begin isolation level repeatable read read only');
    assert.equal(statements.at(-1), 'commit');
    assert.equal(Object.keys(backup.tables).length, 30);
    assert.equal(backup.tables.fortius_inmuebles_staff.length, 1);
    assert.equal((await rehearseCurrent(backup)).passed, true);
    // The transaction is read only: an export query cannot write.
    await db.query('begin isolation level repeatable read read only');
    await assert.rejects(db.query("insert into public.fortius_inmuebles_rate_limits(key) values ('x')"), /read-only/);
    await db.query('rollback');
  } finally { await db.close(); }
});

test('SEG-B15: with the Supabase root certificate the server certificate and name are verified', () => {
  const remote = 'postgresql://postgres.ref:secret@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
  const pem = '-----BEGIN CERTIFICATE-----\nMIIBsynthetic\n-----END CERTIFICATE-----';
  assert.equal(databaseSsl('postgresql://postgres@127.0.0.1:54322/postgres', { FORTIUS_BACKUP_DB_CA: pem }), false);
  assert.deepEqual(databaseSsl(remote, {}), { rejectUnauthorized: false });
  assert.deepEqual(databaseSsl(remote, { FORTIUS_BACKUP_DB_CA: pem }), { rejectUnauthorized: true, ca: pem });
  assert.throws(() => databaseSsl(remote, { FORTIUS_BACKUP_DB_CA: 'not a certificate' }), /PEM/);
});
