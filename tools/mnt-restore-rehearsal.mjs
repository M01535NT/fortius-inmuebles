// In-memory isolated PostgreSQL only. This program has no production client or credentials.
import {PGlite} from '@electric-sql/pglite';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {ownerExport,suffixes,verifyBackup} from './mnt-backup.mjs';

const root=resolve(process.argv[2]??'');
const manifest=await verifyBackup(root);
if(!manifest.database.complete)throw Error('Full owner export required, including tombstones');
const backup=ownerExport(JSON.parse(await readFile(resolve(root,manifest.database.file),'utf8')));
if(backup.prefix!=='cota')throw Error('This rehearsal validates the cota001/002 to mnt003 cutover only');
const db=new PGlite();
const result={format:'mnt-restore-rehearsal-v1',startedAt:new Date().toISOString(),productionWrites:0,objectHashesVerified:manifest.objects.length,tables:{}};
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;`);
  for(const name of ['202609030001_cota_backend.sql','202609030002_cota_record_revisions.sql']) await db.exec(await readFile(resolve('supabase/migrations',name),'utf8'));
  await db.exec('begin');
  for(const row of backup.tables.cota_staff)await db.query('insert into auth.users(id) values($1) on conflict do nothing',[row.user_id]);
  // Owner-only bypass is confined to this new in-memory database. Production restore is not implemented.
  for(const suffix of suffixes)await db.exec(`alter table public.cota_${suffix} disable trigger all`);
  for(const suffix of ['staff','records','record_references','rate_limits','record_revisions']) {
    const rows=backup.tables[`cota_${suffix}`];
    await db.query(`insert into public.cota_${suffix} select * from jsonb_populate_recordset(null::public.cota_${suffix},$1::jsonb)`,[JSON.stringify(rows)]);
  }
  for(const suffix of suffixes)await db.exec(`alter table public.cota_${suffix} enable trigger all`);
  await db.exec('commit');
  const read=async(prefix,suffix)=>(await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]') data from public.${prefix}_${suffix} t`)).rows[0].data;
  const before={};for(const suffix of suffixes)before[suffix]=await read('cota',suffix);
  const ids=(await db.query(`select oid,relname from pg_class where relnamespace='public'::regnamespace and relkind='r' and relname like 'cota_%' order by oid`)).rows;
  // Integrity omitted during owner INSERT must be checked before the cutover.
  const orphanReferences=(await db.query(`select count(*)::int n from public.cota_record_references x left join public.cota_records s on (s.collection,s.id)=(x.source_collection,x.source_id) left join public.cota_records t on (t.collection,t.id)=(x.target_collection,x.target_id) where s.id is null or t.id is null`)).rows[0].n;
  const badRevisions=(await db.query(`select count(*)::int n from public.cota_records r left join public.cota_record_revisions v using(collection,id) where v.last_version is distinct from r.version`)).rows[0].n;
  if(orphanReferences||badRevisions)throw Error('Owner export has inconsistent references or revisions');
  await db.exec(await readFile(resolve('supabase/migrations/202609060003_mnt_identity.sql'),'utf8'));
  for(const suffix of suffixes) {
    const after=await read('mnt',suffix);
    if(JSON.stringify(before[suffix])!==JSON.stringify(after))throw Error(`Cutover changed restored ${suffix} rows`);
    result.tables[suffix]={rows:after.length,exactContentAndDates:true};
  }
  const renamed=(await db.query(`select oid,relname from pg_class where oid=any($1::oid[]) order by oid`,[ids.map(r=>r.oid)])).rows;
  if(JSON.stringify(ids.map(r=>({...r,relname:r.relname.replace('cota_','mnt_')})))!==JSON.stringify(renamed))throw Error('Relation identity changed');
  result.relationIdentitiesPreserved=true;
  if(process.argv.includes('--content')) {
    const recordsBefore=await read('mnt','records'),revisionsBefore=await read('mnt','record_revisions');
    await db.exec(await readFile(resolve('supabase/migrations/202609060004_mnt_content_identity.sql'),'utf8'));
    const recordsAfter=await read('mnt','records'),revisionsAfter=await read('mnt','record_revisions');
    const identity=row=>`${row.collection}/${row.id}`;
    const afterMap=new Map(recordsAfter.map(row=>[identity(row),row]));
    const changed=new Set();
    if(recordsBefore.length!==recordsAfter.length)throw Error('Content migration changed record count');
    for(const old of recordsBefore) {
      const next=afterMap.get(identity(old));if(!next)throw Error('Content migration changed a record identity');
      if(JSON.stringify(old.data)!==JSON.stringify(next.data)) {
        changed.add(identity(old));
        if(next.version!==old.version+1||next.created_at!==old.created_at)throw Error('Changed row revision/date preservation failed');
      } else if(JSON.stringify(old)!==JSON.stringify(next))throw Error('Unchanged row was modified');
    }
    const expectedRevisions=revisionsBefore.map(row=>({...row,last_version:row.last_version+(changed.has(identity(row))?1:0)}));
    const byId=(a,b)=>identity(a).localeCompare(identity(b));
    if(JSON.stringify(expectedRevisions.sort(byId))!==JSON.stringify(revisionsAfter.sort(byId)))throw Error('Revision/tombstone preservation failed after content migration');
    for(const suffix of ['staff','record_references','rate_limits'])if(JSON.stringify(before[suffix])!==JSON.stringify(await read('mnt',suffix)))throw Error('Content migration modified unrelated table');
    result.contentMigration={passed:true,changedRows:changed.size,unchangedRows:recordsBefore.length-changed.size,allIdentitiesPreserved:true,tombstonesPreserved:true};
    if(process.argv.includes('--rollback')) {
      await db.exec(await readFile(resolve(root,'rollback-identity-guarded.sql'),'utf8'));
      if(JSON.stringify(recordsAfter)!==JSON.stringify(await read('cota','records')))throw Error('Inverse altered records');
      const restoredRevisions=(await read('cota','record_revisions')).sort(byId);
      if(JSON.stringify(revisionsAfter)!==JSON.stringify(restoredRevisions))throw Error('Inverse altered revision history');
      result.rollback={passed:true,recordsPreserved:recordsAfter.length,revisionsPreserved:revisionsAfter.length,productionWrites:0};
    } else await writeFile(resolve(root,'content-migration-after.json'),JSON.stringify({records:recordsAfter,revisions:revisionsAfter},null,2));
  }
  result.completedAt=new Date().toISOString();result.passed=true;
  await writeFile(resolve(root,process.argv.includes('--rollback')?'restore-rehearsal-rollback.json':process.argv.includes('--content')?'restore-rehearsal-content.json':'restore-rehearsal.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({passed:true,productionWrites:0,objectsVerified:manifest.objects.length,counts:Object.fromEntries(Object.entries(result.tables).map(([key,value])=>[key,value.rows])),...(result.contentMigration?{contentMigration:result.contentMigration}:{}),...(result.rollback?{rollback:result.rollback}:{})}));
} catch(error) {
  await writeFile(resolve(root,'restore-rehearsal-error.json'),JSON.stringify({failedAt:new Date().toISOString(),code:error.code??null,message:error.message,productionWrites:0},null,2));
  console.error('Isolated rehearsal failed; details saved locally in restore-rehearsal-error.json');
  process.exitCode=1;
} finally {await db.close();}
