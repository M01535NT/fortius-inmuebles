import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export const suffixes = ['staff','records','record_references','rate_limits','record_revisions'];
const currentSuffixes = [...suffixes,'adviser_accounts','comercial_books','comercial_emissions','comercial_revisions','expedientes','file_uploads','formato_assets','formato_drafts','formato_emissions','lead_conversions','signed_copies'];
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
export async function verifyBackup(directory) {
  const root=resolve(directory), manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
  if(manifest.format!=='mnt-backup-v1')throw Error('Invalid manifest');
  for(const file of manifest.files) {
    const data=await readFile(safePath(root,file.file));
    if(data.length!==file.bytes||sha256(data)!==file.sha256) throw Error(`Backup integrity failure for artifact ${file.file}`);
  }
  if(manifest.database?.complete) ownerExport(JSON.parse(await readFile(safePath(root,manifest.database.file),'utf8')));
  return manifest;
}
export async function main(args=process.argv.slice(2)) {
  const arg=name=>args[args.indexOf(name)+1];
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
