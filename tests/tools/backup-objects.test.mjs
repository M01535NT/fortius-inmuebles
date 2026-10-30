import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as backupTools from '../../tools/fortius-inmuebles-backup.mjs';

async function fixture() {
  const parent = await mkdtemp(join(tmpdir(), 'fortius-recovery-test-'));
  const root = join(parent, 'source');
  await mkdir(root);
  const bytes = Buffer.from('synthetic document bytes');
  const sha256 = backupTools.sha256(bytes);
  const owner = {
    format: 'mnt-owner-export-v1', prefix: 'fortius_inmuebles',
    tables: Object.fromEntries(backupTools.currentSuffixes.map(s => [`fortius_inmuebles_${s}`, []])),
  };
  owner.tables.fortius_inmuebles_formato_emissions = [{ path: 'dossier/emission.pdf', sha256 }];
  const dbBytes = Buffer.from(JSON.stringify(owner));
  const file = { file: 'document.bin', bytes: bytes.length, sha256 };
  const manifest = {
    format: 'mnt-backup-v1', prefix: 'fortius_inmuebles',
    files: [file, { file: 'database.json', bytes: dbBytes.length, sha256: backupTools.sha256(dbBytes) }],
    objects: [{ ...file, bucket: 'fortius-inmuebles-expedientes', path: 'dossier/emission.pdf', public: false }],
    buckets: [{ id: 'fortius-inmuebles-expedientes', public: false }],
    database: { complete: true, file: 'database.json' },
  };
  await writeFile(join(root, 'document.bin'), bytes);
  await writeFile(join(root, 'database.json'), dbBytes);
  const save = () => writeFile(join(root, 'manifest.json'), JSON.stringify(manifest));
  await save();
  return { parent, root, manifest, owner, bytes, save, close: () => rm(parent, { recursive: true, force: true }) };
}

test('rejects a complete database snapshot whose emitted document is absent from object inventory', async () => {
  const f = await fixture();
  try {
    f.manifest.objects = [];
    await f.save();
    await assert.rejects(backupTools.verifyBackup(f.root), /referenced object missing/i);
  } finally { await f.close(); }
});

test('reconciles the document fingerprint against the database rather than just the file manifest', async () => {
  const f = await fixture();
  try {
    const changed = Buffer.from('different but internally consistent bytes');
    const entry = f.manifest.files[0];
    entry.bytes = changed.length; entry.sha256 = backupTools.sha256(changed);
    Object.assign(f.manifest.objects[0], entry);
    await writeFile(join(f.root, entry.file), changed);
    await f.save();
    await assert.rejects(backupTools.verifyBackup(f.root), /database object fingerprint/i);
  } finally { await f.close(); }
});

test('rejects an object not covered by the hashed files list and private bucket privacy drift', async () => {
  const f = await fixture();
  try {
    const originals = structuredClone(f.manifest.files);
    f.manifest.files = f.manifest.files.filter(x => x.file !== 'document.bin');
    await f.save();
    await assert.rejects(backupTools.verifyBackup(f.root), /object.*file inventory/i);
    f.manifest.files = originals;
    f.manifest.buckets[0].public = true;
    f.manifest.objects[0].public = true;
    await f.save();
    await assert.rejects(backupTools.verifyBackup(f.root), /private bucket/i);
  } finally { await f.close(); }
});

test('accepts reconciled bytes and copies them into a fresh isolated directory without overwriting a target', async () => {
  const f = await fixture();
  try {
    await backupTools.verifyBackup(f.root);
    assert.equal(typeof backupTools.restoreBackupObjects, 'function', 'isolated object restoration must exist');
    const target = join(f.parent, 'restored');
    const result = await backupTools.restoreBackupObjects(f.root, target);
    assert.equal(result.objects, 1);
    assert.equal(result.productionWrites, 0);
    assert.equal(result.storageServiceRecovery, 'not_checked');
    const restored = JSON.parse(await readFile(join(target, 'objects.json'), 'utf8'));
    assert.deepEqual(await readFile(join(target, restored.objects[0].file)), f.bytes);
    assert.equal(restored.objects[0].bucket, 'fortius-inmuebles-expedientes');
    await assert.rejects(backupTools.restoreBackupObjects(f.root, target), /EEXIST/);
    await assert.rejects(backupTools.restoreBackupObjects(f.root, f.root), /isolated target/i);
  } finally { await f.close(); }
});

test('rejects a file inventory filesystem link that escapes the backup even when its bytes match', async () => {
  const f = await fixture();
  try {
    await rm(join(f.root, 'document.bin'));
    if (process.platform === 'win32') {
      // Directory junctions exercise realpath escape without requiring file-symlink privileges.
      const outside = join(f.parent, 'outside');
      await mkdir(outside);
      await writeFile(join(outside, 'document.bin'), f.bytes);
      await symlink(outside, join(f.root, 'linked'), 'junction');
      f.manifest.files[0].file = 'linked/document.bin';
      f.manifest.objects[0].file = 'linked/document.bin';
      await f.save();
    } else {
      await writeFile(join(f.parent, 'outside.bin'), f.bytes);
      await symlink(join(f.parent, 'outside.bin'), join(f.root, 'document.bin'));
    }
    assert.deepEqual(await readFile(join(f.root, f.manifest.files[0].file)), f.bytes);
    await assert.rejects(backupTools.verifyBackup(f.root), /unsafe manifest path/i);
  } finally { await f.close(); }
});


const appOwner='51000000-0000-4000-8000-000000000001';
async function saveOwner(f){
 const bytes=Buffer.from(JSON.stringify(f.owner));await writeFile(join(f.root,'database.json'),bytes);
 Object.assign(f.manifest.files.find(file=>file.file==='database.json'),{bytes:bytes.length,sha256:backupTools.sha256(bytes)});
 await f.save();
}
async function appFixture(){
 const f=await fixture();
 for(const suffix of ['app_runs','app_run_versions','app_files','app_shares','integration_jobs','integration_artifacts','integration_pages','signature_events'])f.owner.tables['fortius_inmuebles_'+suffix]=[];
 f.owner.schema_version=4;
 for(const [bucket,path,kind] of [
  ['fortius-inmuebles-private',appOwner+'/52000000-0000-4000-8000-000000000003.pdf','app'],
  ['fortius-inmuebles-private',appOwner+'/52000000-0000-4000-8000-000000000004.pdf','app'],
  ['fortius-app-integrations','job/original/hash','original'],
  ['fortius-app-integrations','job/signed/hash','signed'],
  ['fortius-app-integrations','job/audit/hash','audit'],
 ]){
  const bytes=Buffer.from('Synthetic private app bytes: '+path),sha256=backupTools.sha256(bytes);
  const entry={file:'app-'+f.manifest.objects.length+'.bin',bytes:bytes.length,sha256};
  await writeFile(join(f.root,entry.file),bytes);f.manifest.files.push(entry);
  f.manifest.objects.push({...entry,bucket,path,public:false});
  if(!f.manifest.buckets.some(b=>b.id===bucket))f.manifest.buckets.push({id:bucket,public:false});
  const row={sha256,size_bytes:bytes.length};
  if(kind==='app'){
   const expediente_id=f.owner.tables.fortius_inmuebles_app_files.length?'51000000-0000-4000-8000-000000000010':null;
   f.owner.tables.fortius_inmuebles_app_files.push({...row,path,owner_id:appOwner,expediente_id});
   f.owner.tables.fortius_inmuebles_file_uploads.push({bucket,path,uploaded_by:appOwner,record_id:'apps:'+(expediente_id??'independent')});
  }
  else f.owner.tables.fortius_inmuebles_integration_artifacts.push({...row,kind,storage_path:path});
 }
 const bytes=Buffer.from(JSON.stringify(f.owner));await writeFile(join(f.root,'database.json'),bytes);
 Object.assign(f.manifest.files.find(file=>file.file==='database.json'),{bytes:bytes.length,sha256:backupTools.sha256(bytes)});
 await f.save();return f;
}

test('restores every app original, generated result, signed document and audit artifact with private bucket metadata',async()=>{
 const f=await appFixture();try{
  await backupTools.verifyBackup(f.root);
  const target=join(f.parent,'restored-apps'),result=await backupTools.restoreBackupObjects(f.root,target);
  assert.equal(result.objects,6);
  const restored=JSON.parse(await readFile(join(target,'objects.json'),'utf8'));
  for(const object of restored.objects){
   assert.equal(object.public,false);assert.equal(backupTools.sha256(await readFile(join(target,object.file))),object.sha256);
   assert.equal(restored.buckets.find(bucket=>bucket.id===object.bucket).public,false);
  }
  const sourceObjects=structuredClone(f.manifest.objects);
  for(const object of sourceObjects.slice(1)){
   f.manifest.objects=sourceObjects.filter(candidate=>candidate.path!==object.path);await f.save();
   await assert.rejects(backupTools.verifyBackup(f.root),/Referenced object missing/,object.path);
  }
 }finally{await f.close();}
});

test('reconciles app hashes and byte lengths with database rows and rejects private integration bucket drift',async()=>{
 const f=await appFixture();try{
  const source=structuredClone(f.manifest);
  for(const index of [1,3,4,5]){
   const object=f.manifest.objects[index],file=f.manifest.files.find(candidate=>candidate.file===object.file);
   const bytes=Buffer.from('Synthetic replacement bytes for '+index);await writeFile(join(f.root,file.file),bytes);
   Object.assign(file,{sha256:backupTools.sha256(bytes),bytes:bytes.length});Object.assign(object,file);await f.save();
   await assert.rejects(backupTools.verifyBackup(f.root),/Database object fingerprint/);
   const original=source.objects[index],originalBytes=Buffer.from('Synthetic private app bytes: '+original.path);
   await writeFile(join(f.root,file.file),originalBytes);Object.assign(file,source.files.find(candidate=>candidate.file===file.file));Object.assign(object,original);
  }
  for(const name of ['app_files','integration_artifacts']){
   f.owner.tables['fortius_inmuebles_'+name][0].size_bytes++;
   const bytes=Buffer.from(JSON.stringify(f.owner));await writeFile(join(f.root,'database.json'),bytes);
   Object.assign(f.manifest.files.find(file=>file.file==='database.json'),{bytes:bytes.length,sha256:backupTools.sha256(bytes)});await f.save();
   await assert.rejects(backupTools.verifyBackup(f.root),/Database object byte length/);
   f.owner.tables['fortius_inmuebles_'+name][0].size_bytes--;
  }
  f.manifest.buckets.find(bucket=>bucket.id==='fortius-app-integrations').public=true;
  for(const object of f.manifest.objects.filter(object=>object.bucket==='fortius-app-integrations'))object.public=true;
  await f.save();await assert.rejects(backupTools.verifyBackup(f.root),/Private bucket/);
 }finally{await f.close();}
});


test('requires app upload provenance with the same owner, private path and independent or expediente scope',async()=>{
 const f=await appFixture();try{
  await backupTools.verifyBackup(f.root);
  const original=structuredClone(f.owner);
  for(const alter of [
   owner=>{owner.tables.fortius_inmuebles_file_uploads=[];},
   owner=>{owner.tables.fortius_inmuebles_file_uploads[0].bucket='fortius-inmuebles-public';},
   owner=>{owner.tables.fortius_inmuebles_file_uploads[0].path='other/path.pdf';},
   owner=>{owner.tables.fortius_inmuebles_file_uploads[0].uploaded_by='other-owner';},
   owner=>{owner.tables.fortius_inmuebles_file_uploads[0].record_id=null;},
   owner=>{owner.tables.fortius_inmuebles_file_uploads[0].record_id='apps:51000000-0000-4000-8000-000000000010';},
   owner=>{owner.tables.fortius_inmuebles_file_uploads[1].record_id='apps:independent';},
   owner=>{owner.tables.fortius_inmuebles_file_uploads.push({...owner.tables.fortius_inmuebles_file_uploads[0]});},
  ]){
   f.owner=structuredClone(original);alter(f.owner);await saveOwner(f);
   await assert.rejects(backupTools.verifyBackup(f.root),/app.*(?:provenance|receipt)/i);
  }
 }finally{await f.close();}
});

test('validates metadata and uniqueness of buckets even without any objects in them',async()=>{
 const f=await fixture();try{
  const original=structuredClone(f.manifest.buckets);
  for(const extra of [
   [{id:'fortius-app-integrations',public:true}],
   [{id:'fortius-app-integrations'}],
   [{id:'fortius-app-integrations',public:'false'}],
   [{id:'fortius-app-integrations',public:false},{id:'fortius-app-integrations',public:false}],
  ]){
   f.manifest.buckets=[...original,...extra];await f.save();await assert.rejects(backupTools.verifyBackup(f.root),/bucket/i);
  }
  f.manifest.buckets=[...original,{id:'fortius-app-integrations',public:false}];await f.save();await backupTools.verifyBackup(f.root);
 }finally{await f.close();}
});

test('rejects manifest schema downgrades and mismatches while accepting a genuine historical backup',async()=>{
 const f=await fixture();try{
  for(const suffix of [...backupTools.appSuffixes,'interviews',...backupTools.expedienteFileSuffixes])delete f.owner.tables['fortius_inmuebles_'+suffix];
  delete f.owner.schema_version;f.manifest.database.schemaVersion=4;await saveOwner(f);
  await assert.rejects(backupTools.verifyBackup(f.root),/schema.*(?:version|differ)|version.*differ/i);
  f.manifest.database.schemaVersion=1;await f.save();await backupTools.verifyBackup(f.root);
  delete f.manifest.database.schemaVersion;await f.save();await backupTools.verifyBackup(f.root);
  const target=join(f.parent,'legacy-restored');assert.equal((await backupTools.restoreBackupObjects(f.root,target)).objects,1);
  for(const suffix of [...backupTools.appSuffixes,'interviews',...backupTools.expedienteFileSuffixes])f.owner.tables['fortius_inmuebles_'+suffix]=[];
  f.owner.schema_version=4;
  for(const version of [1,2,3,'4',null]){f.manifest.database.schemaVersion=version;await saveOwner(f);await assert.rejects(backupTools.verifyBackup(f.root),/schema.*(?:version|differ)|version.*differ/i);}
  f.manifest.database.schemaVersion=4;await f.save();await backupTools.verifyBackup(f.root);
 }finally{await f.close();}
});


test('requires complete SHA-256 and positive integral sizes for every app file and provider artifact',async()=>{
 const f=await appFixture();try{
  const original=structuredClone(f.owner);
  for(const table of ['app_files','integration_artifacts'])for(const [field,value] of [['sha256',''],['sha256',null],['sha256','not-a-sha256'],['size_bytes',null],['size_bytes',0],['size_bytes',1.5]]){
   f.owner=structuredClone(original);f.owner.tables['fortius_inmuebles_'+table][0][field]=value;await saveOwner(f);
   await assert.rejects(backupTools.verifyBackup(f.root),/app.*(?:fingerprint|size)/i,table+' '+field+' '+value);
  }
 }finally{await f.close();}
});
