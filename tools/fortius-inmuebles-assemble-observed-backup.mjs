// Assemble independent reads only when every canonical owner checksum agrees.
import {PGlite} from '@electric-sql/pglite';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {sha256,verifyBackup,suffixes} from './fortius-inmuebles-backup.mjs';
const [directory,revisionsPath,checksumsPath]=process.argv.slice(2);
if(!directory||!revisionsPath||!checksumsPath)throw Error('Usage: node tools/fortius-inmuebles-assemble-observed-backup.mjs BACKUP_DIR REVISIONS_JSON OWNER_CHECKSUMS_JSON');
const root=resolve(directory),manifest=await verifyBackup(root);
if(manifest.database.complete)throw Error('Already complete; refusing to replace owner evidence');
const revisionsBytes=await readFile(resolve(revisionsPath)),checksumsBytes=await readFile(resolve(checksumsPath));
const revisions=JSON.parse(revisionsBytes),expected=JSON.parse(checksumsBytes);
if(!Array.isArray(revisions))throw Error('Observed revisions must be an array');
const db=new PGlite(),tables={},verified={};
try {
  for(const suffix of suffixes) {
    const snapshot=JSON.parse(await readFile(resolve(root,`rest/${suffix}.json`),'utf8'));
    if(suffix!=='record_revisions'&&!snapshot.complete)throw Error(`Incomplete REST ${suffix}`);
    const rows=suffix==='record_revisions'?revisions:snapshot.rows;
    const keys=suffix==='staff'?['user_id']:suffix==='rate_limits'?['key']:suffix==='record_references'?['source_collection','source_id','field']:['collection','id'];
    const checksum=(await db.query(`select md5(coalesce(jsonb_agg(x order by ${keys.map(k=>`x->>'${k}'`).join(',')}),'[]'::jsonb)::text) checksum from jsonb_array_elements($1::jsonb) x`,[JSON.stringify(rows)])).rows[0].checksum;
    const target=expected[suffix];
    if(!target||target.count!==rows.length||target.md5!==checksum)throw Error(`Owner checksum mismatch for ${suffix}`);
    tables[`${manifest.prefix}_${suffix}`]=rows;verified[suffix]={count:rows.length,md5:checksum};
  }
  const owner={format:'mnt-owner-export-v1',prefix:manifest.prefix,exported_at:new Date().toISOString(),provenance:{kind:'reconstructed-from-service-rest-and-owner-visible-revisions',ownerChecksumsMatched:true,ownerChecksums:verified,rawOwnerDownload:false,details:'Four service REST tables and manually transcribed owner-visible revision rows; each canonical PostgreSQL JSON array matched the independent fresh owner checksum.'},tables};
  const save=async(file,bytes)=>{await writeFile(resolve(root,file),bytes,{flag:'wx'});manifest.files.push({file,bytes:bytes.length,sha256:sha256(bytes)});};
  await save('revisions-owner-observed.json',revisionsBytes);await save('owner-checksums.json',checksumsBytes);
  await save('database-owner.json',Buffer.from(JSON.stringify(owner,null,2)));
  manifest.database={complete:true,file:'database-owner.json',provenance:owner.provenance,counts:Object.fromEntries(Object.entries(tables).map(([name,rows])=>[name,rows.length]))};
  await writeFile(resolve(root,'manifest.json'),JSON.stringify(manifest,null,2));
  await verifyBackup(root);
  console.log(JSON.stringify({assembled:true,ownerChecksumsMatched:true,rawOwnerDownload:false,counts:manifest.database.counts}));
} catch(error) {console.error(error.message);process.exitCode=1;} finally {await db.close();}
