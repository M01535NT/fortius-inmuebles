// Isolated schema rehearsal only: no network client, credentials or production writes.
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {ownerExport,currentSuffixes} from './fortius-inmuebles-backup.mjs';
const quote=value=>'"'+value.replaceAll('"','""')+'"';
export async function createRehearsalDatabase(){
 const db=new PGlite();
 try{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
   create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
   grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;`);
  const dir=new URL('../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
  return db;
 }catch(error){await db.close();throw error;}
}
export async function rehearseCurrent(input){
 const backup=ownerExport(input);
 if(backup.prefix!=='fortius_inmuebles')throw Error('Current Fortius export required');
 const db=await createRehearsalDatabase();
 try{
  const actual=(await db.query("select tablename from pg_tables where schemaname='public' and tablename like 'fortius_inmuebles_%' order by tablename")).rows.map(r=>r.tablename);
  const expected=currentSuffixes.map(s=>'fortius_inmuebles_'+s).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Export inventory differs from migrated schema');
  const fks=(await db.query(`select c.conrelid::regclass::text as rel,c.conname,pg_get_constraintdef(c.oid) as definition,
   c.confrelid='auth.users'::regclass as auth_fk,a.attname as auth_column
   from pg_constraint c left join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
   where c.contype='f' and c.connamespace='public'::regnamespace`)).rows;
  await db.exec('begin');
  // Reconstitute identity references only, not accounts/passwords/sessions.
  for(const fk of fks.filter(f=>f.auth_fk))for(const row of backup.tables[fk.rel.replace('public.','')]??[]){
   if(row[fk.auth_column])await db.query('insert into auth.users(id) values($1) on conflict do nothing',[row[fk.auth_column]]);
  }
  // Disabling triggers is limited to this newly created, in-memory database.
  for(const table of expected)await db.exec(`alter table public.${quote(table)} disable trigger all`);
  for(const table of expected)await db.query(`insert into public.${quote(table)} select * from jsonb_populate_recordset(null::public.${quote(table)},$1::jsonb)`,[JSON.stringify(backup.tables[table])]);
  for(const table of expected)await db.exec(`alter table public.${quote(table)} enable trigger all`);
  // Restoring with triggers disabled does not validate FK rows retroactively.
  // Re-create each actual FK as NOT VALID, then ask PostgreSQL to validate it.
  for(const fk of fks){
   const table=quote(fk.rel.replace('public.',''));
   await db.exec(`alter table public.${table} drop constraint ${quote(fk.conname)}; alter table public.${table} add constraint ${quote(fk.conname)} ${fk.definition} not valid; alter table public.${table} validate constraint ${quote(fk.conname)}`);
  }
  const tables={};
  for(const suffix of currentSuffixes){
   const table='fortius_inmuebles_'+suffix,rows=backup.tables[table];
   const result=await db.query(`select count(*)::int n from ((select to_jsonb(t) from public.${quote(table)} t except all select value from jsonb_array_elements($1::jsonb)) union all (select value from jsonb_array_elements($1::jsonb) except all select to_jsonb(t) from public.${quote(table)} t)) differences`,[JSON.stringify(rows)]);
   if(result.rows[0].n)throw Error('Restored content differs: '+suffix);
   tables[suffix]={rows:rows.length,exactContentAndDates:true};
  }
  const bad=(await db.query(`select count(*)::int n from public.fortius_inmuebles_records r left join public.fortius_inmuebles_record_revisions v using(collection,id) where v.last_version is distinct from r.version`)).rows[0].n;
  if(bad)throw Error('Restored revisions do not match records');
  await db.exec('commit');
  return {passed:true,productionWrites:0,tables,foreignKeysValidated:fks.length,auth:'Identity placeholders only; full Auth recovery is not tested',storage:'Object hashes are checked by the backup verifier; Storage service recovery is not tested'};
 }finally{await db.close();}
}
