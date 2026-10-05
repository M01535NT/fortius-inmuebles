import {afterEach,expect,test} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
let db:PGlite|undefined;
afterEach(async()=>{await db?.close();db=undefined;});
async function fixture(){
  db=new PGlite();
  await db.exec(`create table public.cota_records(id text);insert into public.cota_records values('preserved');create function public.cota_public_records(p_collection text) returns table(data jsonb) language sql as $$select '{}'::jsonb$$;`);
  return readFile(new URL('../../supabase/migrations/202609060003_fortius_inmuebles_identity.sql',import.meta.url),'utf8');
}
test('existing target function fails before mutating old relation or either function',async()=>{
  const sql=await fixture();
  await db!.exec(`create function public.mnt_public_records(p_collection text) returns table(data jsonb) language sql as $$select '{"existing":true}'::jsonb$$;`);
  const functions=(await db!.query("select oid,proname,prosrc from pg_proc where pronamespace='public'::regnamespace order by oid")).rows;
  await expect(db!.exec(sql)).rejects.toThrow(/existing MNT relations or functions/);
  await db!.exec('rollback');
  expect((await db!.query('select * from public.cota_records')).rows).toEqual([{id:'preserved'}]);
  expect((await db!.query("select oid,proname,prosrc from pg_proc where pronamespace='public'::regnamespace order by oid")).rows).toEqual(functions);
});
test('any target relation fails before mutations, not only the records table',async()=>{
  const sql=await fixture();await db!.exec('create table public.mnt_existing(id int)');
  await expect(db!.exec(sql)).rejects.toThrow(/existing MNT relations or functions/);await db!.exec('rollback');
  expect((await db!.query('select * from public.cota_records')).rows).toEqual([{id:'preserved'}]);
  expect((await db!.query("select to_regclass('public.mnt_existing') name")).rows[0]).toEqual({name:'mnt_existing'});
});
test('missing source reader or relation fails with an explicit precondition',async()=>{
  const sql=await fixture();await db!.exec('drop function public.cota_public_records(text)');
  await expect(db!.exec(sql)).rejects.toThrow(/original COTA table and public reader/);await db!.exec('rollback');
  expect((await db!.query('select * from public.cota_records')).rows).toHaveLength(1);
  await db!.exec('drop table public.cota_records');
  await expect(db!.exec(sql)).rejects.toThrow(/original COTA table and public reader/);await db!.exec('rollback');
});
