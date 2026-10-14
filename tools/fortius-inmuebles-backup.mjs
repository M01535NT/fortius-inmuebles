import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

export const suffixes = ['staff','records','record_references','rate_limits','record_revisions'];
// Parents precede their dependent tables. records/expedientes form a cycle;
// the isolated restorer revalidates every FK after loading both sides.
export const historicalCurrentSuffixes = ['staff','records','record_revisions','rate_limits','adviser_accounts','expedientes','record_references','file_uploads','formato_drafts','formato_assets','formato_emissions','signed_copies','comercial_books','comercial_revisions','comercial_emissions','lead_conversions','record_history','expediente_actividad'];
export const appSuffixes = ['app_runs','app_run_versions','app_files','app_shares','integration_jobs','integration_artifacts','integration_pages','signature_events'];
export const appsCurrentSuffixes = [...historicalCurrentSuffixes,...appSuffixes];
export const currentSuffixes = [...appsCurrentSuffixes,"interviews"];
export const currentSchemaVersion = 3;
export function ownerSchemaVersion(data) {
  if (data.prefix !== 'fortius_inmuebles') return undefined;
  if (Object.hasOwn(data,'schema_version')) {
    if (![1,2,currentSchemaVersion].includes(data.schema_version)) throw Error('Unsupported owner backup schema version');
    return data.schema_version;
  }
  // Only the complete pre-Apps inventory is historical. A partial Apps export
  // must fail instead of silently replacing omitted tables with empty arrays.
  return Object.hasOwn(data.tables ?? {},'fortius_inmuebles_interviews') ? 3 : appSuffixes.some(s => Object.hasOwn(data.tables ?? {},'fortius_inmuebles_'+s)) ? 2 : 1;
}
export function tableOrderKeys(suffix) {
  if (!currentSuffixes.includes(suffix)) throw Error('Unknown backup table');
  const keys={staff:['user_id'],adviser_accounts:['user_id'],rate_limits:['key'],record_references:['source_collection','source_id','field'],records:['collection','id'],record_revisions:['collection','id'],comercial_revisions:['book_id','version'],lead_conversions:['lead_id'],app_run_versions:['run_id','version'],signature_events:['hash']};
  return keys[suffix] ?? ['id'];
}
export function isBackupBucket(prefix,id) {
  return id.startsWith(prefix.replaceAll('_','-')+'-') || (prefix==='fortius_inmuebles' && id==='fortius-app-integrations');
}
export const sha256 = data => createHash('sha256').update(data).digest('hex');
function validateAppInventory(data) {
  if(data.prefix!=='fortius_inmuebles') return;
  for(const row of [...(data.tables.fortius_inmuebles_app_files??[]),...(data.tables.fortius_inmuebles_integration_artifacts??[])]) {
    if(typeof row.sha256!=='string' || !/^[a-f0-9]{64}$/.test(row.sha256)) throw Error('App object fingerprint is missing or invalid');
    if(!Number.isSafeInteger(row.size_bytes) || row.size_bytes<=0) throw Error('App object size is missing or invalid');
  }
  const receipts=new Map();
  for(const row of data.tables.fortius_inmuebles_file_uploads) {
    if(row.bucket!=='fortius-inmuebles-private') continue;
    const matches=receipts.get(row.path)??[];matches.push(row);receipts.set(row.path,matches);
  }
  // Both uploaded originals and generated PDFs claim the same private receipt.
  // Provider artifacts instead belong to their job and have a separate inventory.
  for(const file of data.tables.fortius_inmuebles_app_files??[]) {
    const matches=receipts.get(file.path)??[],receipt=matches[0];
    const binding='apps:'+(file.expediente_id??'independent');
    if(matches.length!==1 || typeof file.owner_id!=='string' || typeof file.path!=='string'
      || !file.path.startsWith(file.owner_id+'/') || receipt.uploaded_by!==file.owner_id || receipt.record_id!==binding) {
      throw Error('App file upload receipt provenance differs or is missing');
    }
  }
}
export function ownerExport(raw) {
  let data=Array.isArray(raw)?raw[0]:raw;
  data=data.backup??data;
  if(typeof data==='string') data=JSON.parse(data);
  if(data.format==='mnt-backup-v1'&&Array.isArray(data.records)) {
    const prefix=data.prefix??'cota';
    data={format:'mnt-owner-export-v1',prefix,exported_at:data.created_at,tables:{[`${prefix}_staff`]:data.staff,[`${prefix}_records`]:data.records,[`${prefix}_record_references`]:data.references,[`${prefix}_rate_limits`]:data.rate_limits,[`${prefix}_record_revisions`]:data.revisions}};
  }
  if(data.format!=='mnt-owner-export-v1'||!['cota','mnt','fortius_inmuebles'].includes(data.prefix)) throw Error('Invalid owner backup format');
  const required=data.prefix==='fortius_inmuebles'?(ownerSchemaVersion(data)===3?currentSuffixes:ownerSchemaVersion(data)===2?appsCurrentSuffixes:historicalCurrentSuffixes):suffixes;
  for(const suffix of required) if(!Array.isArray(data.tables?.[`${data.prefix}_${suffix}`])) throw Error('Incomplete owner backup tables');
  if(data.prefix==='fortius_inmuebles') {
    const allowed=new Set(required.map(s=>data.prefix+'_'+s));
    if(Object.keys(data.tables).some(table=>!allowed.has(table))) throw Error('Unexpected owner backup table');
  }
  validateAppInventory(data);
  return data;
}
function safePath(root,file) {
  const path=resolve(root,file), rel=relative(root,path);
  if(isAbsolute(rel)||rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')) throw Error('Unsafe manifest path');
  return path;
}
async function readBackupFile(root, file) {
  const actual = await realpath(safePath(root, file));
  safePath(root, relative(root, actual));
  return readFile(actual);
}
function reconcileObjects(manifest, database) {
  const files = new Map();
  for (const file of manifest.files) {
    if (files.has(file.file)) throw Error('Duplicate backup file inventory');
    files.set(file.file, file);
  }
  const buckets = new Map();
  for(const bucket of manifest.buckets??[]) {
    if(!bucket || typeof bucket.id!=='string' || !bucket.id || typeof bucket.public!=='boolean') throw Error('Invalid bucket metadata');
    if(buckets.has(bucket.id)) throw Error('Duplicate backup bucket inventory');
    if(!bucket.id.endsWith('-public') && bucket.public) throw Error('Private bucket marked public');
    buckets.set(bucket.id,bucket);
  }
  const objects = new Map();
  const key = (bucket, path) => JSON.stringify([bucket, path]);
  for (const object of manifest.objects ?? []) {
    const file = files.get(object.file);
    if (!file || file.bytes !== object.bytes || file.sha256 !== object.sha256) throw Error('Object differs from hashed file inventory');
    const bucket = buckets.get(object.bucket);
    if (!bucket || typeof bucket.public !== 'boolean' || object.public !== bucket.public) throw Error('Object bucket metadata is inconsistent');
    if (!object.bucket.endsWith('-public') && bucket.public) throw Error('Private bucket marked public');
    const id = key(object.bucket, object.path);
    if (objects.has(id)) throw Error('Duplicate backup object inventory');
    objects.set(id, object);
  }
  if (database?.prefix !== 'fortius_inmuebles') return;
  const requireObject = (bucket, path, fingerprint, byteLength) => {
    const object = objects.get(key(bucket, path));
    if (!object) throw Error('Referenced object missing from backup');
    if (fingerprint && object.sha256 !== fingerprint) throw Error('Database object fingerprint differs from backed-up bytes');
    if (byteLength != null && object.bytes !== byteLength) throw Error('Database object byte length differs from backed-up bytes');
  };
  const table = suffix => database.tables[`fortius_inmuebles_${suffix}`] ?? [];
  for (const suffix of ['formato_emissions', 'signed_copies', 'formato_assets']) {
    for (const row of table(suffix)) requireObject('fortius-inmuebles-expedientes', row.path, row.sha256, row.byte_length);
  }
  for (const row of table('comercial_emissions')) requireObject('fortius-inmuebles-comercial', row.path, row.sha256);
  for (const row of table('app_files')) requireObject('fortius-inmuebles-private', row.path, row.sha256, row.size_bytes);
  for (const row of table('integration_artifacts')) requireObject('fortius-app-integrations', row.storage_path, row.sha256, row.size_bytes);
  for (const row of table('file_uploads')) requireObject(row.bucket, row.path);
  for (const row of table('records')) {
    if (row.collection === 'archivos' && row.data?.bucket && row.data?.path) requireObject(row.data.bucket, row.data.path);
  }
}
export async function verifyBackup(directory) {
  const root=await realpath(resolve(directory)), manifest=JSON.parse(await readBackupFile(root,'manifest.json'));
  if(manifest.format!=='mnt-backup-v1')throw Error('Invalid manifest');
  for(const file of manifest.files) {
    const data=await readBackupFile(root,file.file);
    if(data.length!==file.bytes||sha256(data)!==file.sha256) throw Error(`Backup integrity failure for artifact ${file.file}`);
  }
  let database;
  if(manifest.database?.complete) {
    if (!manifest.files.some(file => file.file === manifest.database.file)) throw Error('Database missing from hashed file inventory');
    database=ownerExport(JSON.parse(await readBackupFile(root,manifest.database.file)));
    if (manifest.prefix && manifest.prefix !== database.prefix) throw Error('Database and manifest prefix differ');
    if (Object.hasOwn(manifest.database,'schemaVersion') && manifest.database.schemaVersion!==ownerSchemaVersion(database)) {
      throw Error('Database and manifest schema versions differ');
    }
  }
  reconcileObjects(manifest, database);
  return manifest;
}
export async function restoreBackupObjects(directory, destination) {
  const root = await realpath(resolve(directory));
  const requested = resolve(destination);
  const target = resolve(await realpath(dirname(requested)), basename(requested));
  const contains = (parent, child) => {
    const rel = relative(parent, child);
    return !rel || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\'));
  };
  if (contains(root, target) || contains(target, root)) throw Error('An isolated target outside the backup is required');
  const manifest = await verifyBackup(root);
  await mkdir(target, { mode: 0o700 }); // Refuse existing destinations, including symlinks.
  const objects = [];
  for (const object of manifest.objects ?? []) {
    const bytes = await readBackupFile(root, object.file);
    if (sha256(bytes) !== object.sha256 || bytes.length !== object.bytes) throw Error('Source object changed after verification');
    const file = `${String(objects.length + 1).padStart(8, '0')}.bin`;
    await writeFile(resolve(target, file), bytes, { flag: 'wx', mode: 0o600 });
    if (sha256(await readFile(resolve(target, file))) !== object.sha256) throw Error('Restored object integrity failure');
    objects.push({ ...object, file });
  }
  await writeFile(resolve(target, 'objects.json'), JSON.stringify({ format: 'fortius-local-object-recovery-v1', objects, buckets: manifest.buckets }, null, 2), { flag: 'wx', mode: 0o600 });
  return { passed: true, productionWrites: 0, objects: objects.length, bytes: objects.reduce((n, o) => n + o.bytes, 0), storageServiceRecovery: 'not_checked' };
}
// These internal ledgers deliberately have no service-role SELECT grant.
// A denied supplemental read is acceptable only with a complete current owner export.
const ownerOnlyLedgers = new Set(['record_revisions','record_history','lead_conversions']);
export async function readRestSnapshot(client,prefix,suffix,ownerDatabase) {
  const table=prefix+'_'+suffix,rows=[];
  let errorCode=null;
  for(let offset=0;;offset+=1000) {
    let query=client.from(table).select('*').range(offset,offset+999);
    for(const column of tableOrderKeys(suffix))query=query.order(column,{ascending:true});
    const {data,error}=await query;
    if(error){errorCode=error.code||'request-failed';break;}
    rows.push(...data);if(data.length<1000)break;
  }
  let ownerCovered=false;
  if(errorCode && prefix==='fortius_inmuebles' && errorCode==='42501' && ownerOnlyLedgers.has(suffix) && ownerDatabase) {
    const owner=ownerExport(ownerDatabase);
    ownerCovered=owner.prefix===prefix && ownerSchemaVersion(owner)===currentSchemaVersion;
  }
  const legacyRevision=prefix!=='fortius_inmuebles' && suffix==='record_revisions';
  if(errorCode && !ownerCovered && !legacyRevision)throw Error('REST backup failed for '+suffix+' ('+errorCode+')');
  return {table,complete:!errorCode,errorCode,ownerCovered,rows};
}
export async function main(args=process.argv.slice(2)) {
  const arg=name=>args[args.indexOf(name)+1];
  if (args.includes('--restore-objects')) {
    if (!args.includes('--target') || !arg('--target') || !arg('--restore-objects')) throw Error('Usage: --restore-objects BACKUP_DIR --target NEW_ISOLATED_DIR');
    console.log(JSON.stringify(await restoreBackupObjects(arg('--restore-objects'), arg('--target'))));
    return;
  }
  if(args.includes('--verify')||args.includes('--diagnose')) {
    const root=resolve(arg(args.includes('--verify')?'--verify':'--diagnose'));
    const manifest=await verifyBackup(root);
    if(args.includes('--diagnose')) {
      const database=manifest.database?.complete?ownerExport(JSON.parse(await readFile(resolve(root,manifest.database.file),'utf8'))):null;
      const text=database?JSON.stringify(database.tables):null;
      const candidates=manifest.objects.filter(o=>o.bucket.endsWith('-staging')||(text!==null&&!text.includes(o.path))).map(o=>({bucket:o.bucket,path:o.path,sha256:o.sha256,reason:o.bucket.endsWith('-staging')?'temporary-staging':'not-referenced-in-owner-export'}));
      await writeFile(resolve(root,'diagnostic-candidates.json'),JSON.stringify({generatedAt:new Date().toISOString(),candidateOnly:true,deleted:0,candidates},null,2));
      console.log(JSON.stringify({verified:true,candidates:candidates.length,deleted:0,privateDetails:'saved locally'}));
    } else console.log(JSON.stringify({verified:true,files:manifest.files.length,objects:manifest.objects.length,databaseComplete:manifest.database?.complete??false}));
    return;
  }
  const prefix=args.includes('--prefix')?arg('--prefix'):'fortius_inmuebles';
  if(!['cota','mnt','fortius_inmuebles'].includes(prefix))throw Error('Invalid backup schema prefix');
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw Error('Required Supabase environment missing; load .env.local via node --env-file');
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const root=resolve('.superpowers/backups',new Date().toISOString().replace(/[:.]/g,'-'));
  await mkdir(root,{recursive:true});
  const manifest={format:'mnt-backup-v1',startedAt:new Date().toISOString(),prefix,files:[],objects:[],buckets:[],database:{complete:false},consistency:'Reads require a coordinated write freeze for a consistent database/object snapshot.'};
  const save=async(file,data)=>{const buffer=Buffer.isBuffer(data)?data:Buffer.from(data);const path=safePath(root,file);await mkdir(dirname(path),{recursive:true});await writeFile(path,buffer,{flag:'wx'});const entry={file,bytes:buffer.length,sha256:sha256(buffer)};manifest.files.push(entry);return entry;};
  let ownerDatabase;
  if(args.includes('--database')) {
    const original=await readFile(resolve(arg('--database')));
    const db=ownerExport(JSON.parse(original));
    ownerDatabase=db;
    if(db.prefix!==prefix)throw Error('Owner export prefix differs from requested backup');
    const entry=await save('database-owner.json',original);
    manifest.database={complete:true,file:entry.file,exportedAt:db.exported_at,schemaVersion:ownerSchemaVersion(db),counts:Object.fromEntries(Object.entries(db.tables).map(([name,rows])=>[name,rows.length]))};
  }
  // REST is supplemental: retain explicit gaps, never label them complete.
  manifest.rest={complete:true,unavailable:[]};
  for(const suffix of prefix==='fortius_inmuebles'?currentSuffixes:suffixes) {
    const snapshot=await readRestSnapshot(client,prefix,suffix,ownerDatabase);
    await save('rest/'+suffix+'.json',JSON.stringify(snapshot,null,2));
    if(!snapshot.complete) {
      manifest.rest.complete=false;
      manifest.rest.unavailable.push({table:snapshot.table,errorCode:snapshot.errorCode,ownerCovered:snapshot.ownerCovered});
    }
  }
  const {data:buckets,error:bucketError}=await client.storage.listBuckets();
  if(bucketError)throw Error('Storage bucket listing failed');
  manifest.buckets=buckets.filter(b=>isBackupBucket(prefix,b.id));
  if(!manifest.buckets.length)throw Error('No matching buckets found');
  for(const bucket of manifest.buckets) {
    async function walk(folder='') {
      for(let offset=0;;offset+=1000) {
        const {data,error}=await client.storage.from(bucket.id).list(folder,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});
        if(error)throw Error('Storage object listing failed');
        for(const object of data) {
          const path=folder?`${folder}/${object.name}`:object.name;
          if(object.id===null){await walk(path);continue;}
          const {data:blob,error:downloadError}=await client.storage.from(bucket.id).download(path);
          if(downloadError)throw Error('Storage download failed');
          const bytes=Buffer.from(await blob.arrayBuffer());
          const entry=await save(`objects/${String(manifest.objects.length+1).padStart(8,'0')}.bin`,bytes);
          manifest.objects.push({...entry,bucket:bucket.id,path,mime:blob.type||object.metadata?.mimetype||null,public:bucket.public,metadata:object.metadata,createdAt:object.created_at,updatedAt:object.updated_at});
        }
        if(data.length<1000)break;
      }
    }
    await walk();
  }
  await save('buckets.json',JSON.stringify(manifest.buckets,null,2));
  manifest.completedAt=new Date().toISOString();
  manifest.counts={buckets:manifest.buckets.length,objects:manifest.objects.length,bytes:manifest.objects.reduce((n,o)=>n+o.bytes,0)};
  await writeFile(resolve(root,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
  await verifyBackup(root);
  console.log(JSON.stringify({backup:root,verified:true,...manifest.counts,databaseComplete:manifest.database.complete,restComplete:manifest.rest.complete,restUnavailable:manifest.rest.unavailable.length}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(error=>{console.error(error.message);process.exitCode=1;});
