// Isolated schema rehearsal only: no network client, credentials or production writes.
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {ownerExport,currentSuffixes,ownerSchemaVersion} from './fortius-inmuebles-backup.mjs';
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
 const sourceSchemaVersion=ownerSchemaVersion(backup);
 const emptyTablesAdded=currentSuffixes.filter(s=>!Object.hasOwn(backup.tables,'fortius_inmuebles_'+s));
 const rowsFor=table=>backup.tables[table]??[];
 const db=await createRehearsalDatabase();
 try{
  const actual=(await db.query("select tablename from pg_tables where schemaname='public' and tablename like 'fortius_inmuebles_%' order by tablename")).rows.map(r=>r.tablename);
  const expected=currentSuffixes.map(s=>'fortius_inmuebles_'+s);
  if(JSON.stringify(actual)!==JSON.stringify([...expected].sort()))throw Error('Export inventory differs from migrated schema');
  const columnRows=(await db.query(`select table_name,column_name,is_generated from information_schema.columns
   where table_schema='public' and table_name=any($1::text[]) order by table_name,ordinal_position`,[expected])).rows;
  const columns=new Map(expected.map(table=>[table,{
   writable:columnRows.filter(c=>c.table_name===table&&c.is_generated==='NEVER').map(c=>c.column_name),
   generated:columnRows.filter(c=>c.table_name===table&&c.is_generated!=='NEVER').map(c=>c.column_name),
  }]));
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
  // Generated columns must be calculated by PostgreSQL, not copied from the export.
  for(const table of expected){
   const writable=columns.get(table).writable.map(quote).join(',');
   if(!writable)throw Error('Migrated table has no writable columns: '+table);
   await db.query(`insert into public.${quote(table)} (${writable}) select ${writable} from jsonb_populate_recordset(null::public.${quote(table)},$1::jsonb)`,[JSON.stringify(rowsFor(table))]);
  }
  for(const table of expected)await db.exec(`alter table public.${quote(table)} enable trigger all`);
  // Restoring with triggers disabled does not validate FK rows retroactively.
  // Re-create each actual FK as NOT VALID, then ask PostgreSQL to validate it.
  for(const fk of fks){
   const table=quote(fk.rel.replace('public.',''));
   await db.exec(`alter table public.${table} drop constraint ${quote(fk.conname)}; alter table public.${table} add constraint ${quote(fk.conname)} ${fk.definition} not valid; alter table public.${table} validate constraint ${quote(fk.conname)}`);
  }
  // FK validation alone can trust a stale reference index whose targets exist,
  // while the JSON record points somewhere else. Rebuild the derived inventory
  // using the migrated write function, then compare it with the source below.
  // Only this isolated database is changed; never normalize the owner export.
  await db.exec('select public.fortius_inmuebles_sync_references(collection,id,data) from public.fortius_inmuebles_records');
  const tables={};
  for(const suffix of currentSuffixes){
   const table='fortius_inmuebles_'+suffix,rows=rowsFor(table);
   // Only calculated fields absent from older exports may differ in shape.
   // Compare every writable field/date exactly, then every supplied calculated value.
   const result=await db.query(`with restored as (select to_jsonb(t) value from public.${quote(table)} t),
    supplied as (select value from jsonb_array_elements($1::jsonb)),
    differences as ((select value-$2::text[] from restored except all select value-$2::text[] from supplied)
     union all (select value-$2::text[] from supplied except all select value-$2::text[] from restored))
    select (select count(*)::int from differences) n,
     (select count(*)::int from supplied s join restored r on s.value-$2::text[]=r.value-$2::text[]
      where exists(select 1 from unnest($2::text[]) g(column_name)
       where s.value ? g.column_name and s.value->g.column_name is distinct from r.value->g.column_name)) generated
    `,[JSON.stringify(rows),columns.get(table).generated]);
   if(result.rows[0].n)throw Error(suffix==='record_references'?'Restored reference inventory differs from record JSON':'Restored content differs: '+suffix);
   if(result.rows[0].generated)throw Error('Restored generated content differs: '+suffix);
   tables[suffix]={rows:rows.length,exactContentAndDates:true};
  }
  const bad=(await db.query(`select count(*)::int n from public.fortius_inmuebles_records r left join public.fortius_inmuebles_record_revisions v using(collection,id) where v.last_version is distinct from r.version`)).rows[0].n;
  if(bad)throw Error('Restored revisions do not match records');
  // Version rows are immutable recovery evidence, including recoverable deletions.
  // Empty or stale histories must not pass just because all FK targets exist.
  const badAppVersions=(await db.query(`select count(*)::int n from public.fortius_inmuebles_app_runs r
   left join public.fortius_inmuebles_app_run_versions v on v.run_id=r.id and v.version=r.version
   where v.snapshot is distinct from to_jsonb(r)
    or (select count(*) from public.fortius_inmuebles_app_run_versions h where h.run_id=r.id)<>r.version
    or (select min(version) from public.fortius_inmuebles_app_run_versions h where h.run_id=r.id)<>1
    or (select max(version) from public.fortius_inmuebles_app_run_versions h where h.run_id=r.id)<>r.version`)).rows[0].n;
  if(badAppVersions)throw Error('Restored app version history does not match runs');
  await db.exec('commit');
  return {passed:true,productionWrites:0,sourceSchemaVersion,emptyTablesAdded,restoreOrder:[...currentSuffixes],tables,foreignKeysValidated:fks.length,auth:'Identity placeholders only; full Auth recovery is not tested',storage:'Object hashes are checked by the backup verifier; Storage service recovery is not tested'};
 }finally{await db.close();}
}
