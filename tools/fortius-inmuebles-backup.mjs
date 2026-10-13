import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

export const suffixes = ['staff','records','record_references','rate_limits','record_revisions'];
export const currentSuffixes = [...suffixes,'adviser_accounts','comercial_books','comercial_emissions','comercial_revisions','expedientes','file_uploads','formato_assets','formato_drafts','formato_emissions','lead_conversions','signed_copies','record_history','expediente_actividad'];
export const sha256 = data => createHash('sha256').update(data).digest('hex');
export function ownerExport(raw) {
  let data=Array.isArray(raw)?raw[0]:raw;
  data=data.backup??data;
  if(typeof data==='string') data=JSON.parse(data);
  if(data.format==='mnt-backup-v1'&&Array.isArray(data.records)) {
    const prefix=data.prefix??'cota';
    data={format:'mnt-owner-export-v1',prefix,exported_at:data.created_at,tables:{[`${prefix}_staff`]:data.staff,[`${prefix}_records`]:data.records,[`${prefix}_record_references`]:data.references,[`${prefix}_rate_limits`]:data.rate_limits,[`${prefix}_record_revisions`]:data.revisions}};
  }
  if(data.format!=='mnt-owner-export-v1'||!['cota','mnt','fortius_inmuebles'].includes(data.prefix)) throw Error('Invalid owner backup format');
  for(const suffix of data.prefix==='fortius_inmuebles'?currentSuffixes:suffixes) if(!Array.isArray(data.tables?.[`${data.prefix}_${suffix}`])) throw Error('Incomplete owner backup tables');
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
  const buckets = new Map((manifest.buckets ?? []).map(bucket => [bucket.id, bucket]));
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
  const table = suffix => database.tables[`fortius_inmuebles_${suffix}`];
  for (const suffix of ['formato_emissions', 'signed_copies', 'formato_assets']) {
    for (const row of table(suffix)) requireObject('fortius-inmuebles-expedientes', row.path, row.sha256, row.byte_length);
  }
  for (const row of table('comercial_emissions')) requireObject('fortius-inmuebles-comercial', row.path, row.sha256);
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
  if(args.includes('--database')) {
    const original=await readFile(resolve(arg('--database')));
    const db=ownerExport(JSON.parse(original));
    if(db.prefix!==prefix)throw Error('Owner export prefix differs from requested backup');
    const entry=await save('database-owner.json',original);
    manifest.database={complete:true,file:entry.file,exportedAt:db.exported_at,counts:Object.fromEntries(Object.entries(db.tables).map(([name,rows])=>[name,rows.length]))};
  }
  // Independent REST snapshot is useful cross-check evidence, never a substitute for owner revisions.
  for(const suffix of suffixes) {
    const table=`${prefix}_${suffix}`, rows=[];
    let errorCode=null;
    for(let offset=0;;offset+=1000) {
      let query=client.from(table).select('*').range(offset,offset+999);
      const keys=suffix==='staff'?['user_id']:suffix==='rate_limits'?['key']:suffix==='record_references'?['source_collection','source_id','field']:['collection','id'];
      for(const column of keys)query=query.order(column,{ascending:true});
      const {data,error}=await query;
      if(error){errorCode=error.code||'request-failed';break;}
      rows.push(...data); if(data.length<1000)break;
    }
    await save(`rest/${suffix}.json`,JSON.stringify({table,complete:!errorCode,errorCode,rows},null,2));
    if(errorCode&&suffix!=='record_revisions')throw Error(`REST backup failed for ${suffix} (${errorCode})`);
  }
  const {data:buckets,error:bucketError}=await client.storage.listBuckets();
  if(bucketError)throw Error('Storage bucket listing failed');
  manifest.buckets=buckets.filter(b=>b.id.startsWith(`${prefix.replaceAll("_", "-")}-`));
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
  console.log(JSON.stringify({backup:root,verified:true,...manifest.counts,databaseComplete:manifest.database.complete}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(error=>{console.error(error.message);process.exitCode=1;});
