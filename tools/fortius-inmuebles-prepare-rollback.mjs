// Local preparation only; produces a guarded SQL artifact, never executes remotely.
import {PGlite} from '@electric-sql/pglite';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {ownerExport,suffixes,verifyBackup} from './fortius-inmuebles-backup.mjs';
const root=resolve(process.argv[2]??'');
const manifest=await verifyBackup(root);
const owner=ownerExport(JSON.parse(await readFile(resolve(root,manifest.database.file),'utf8')));
const rehearsal=JSON.parse(await readFile(resolve(root,'restore-rehearsal-content.json'),'utf8'));
if(!rehearsal.contentMigration?.passed)throw Error('Successful content rehearsal required');
const after=JSON.parse(await readFile(resolve(root,'content-migration-after.json'),'utf8'));
const db=new PGlite();
try {
  const values=[];
  for(const suffix of suffixes) {
    const rows=suffix==='records'?after.records:suffix==='record_revisions'?after.revisions:owner.tables[`${owner.prefix}_${suffix}`];
    const keys=suffix==='staff'?['user_id']:suffix==='rate_limits'?['key']:suffix==='record_references'?['source_collection','source_id','field']:['collection','id'];
    const normalized=suffix==='records'?rows.map(({updated_at: _updatedAt,...rest})=>{void _updatedAt;return rest;}):rows;
    const timestamp=suffix==='staff'||suffix==='records'?'created_at':suffix==='rate_limits'?'window_start':null;
    const typed=timestamp?`jsonb_set(raw,'{${timestamp}}',to_jsonb((raw->>'${timestamp}')::timestamptz))`:'raw';
    const hash=(await db.query(`select md5(coalesce(jsonb_agg(x order by ${keys.map(k=>`x->>'${k}'`).join(',')}),'[]'::jsonb)::text) checksum from (select ${typed} x from jsonb_array_elements($1::jsonb) raw) typed`,[JSON.stringify(normalized)])).rows[0].checksum;
    values.push(`('${suffix}',${rows.length},'${hash}')`);
  }
  const preamble=`-- Expected isolated003004 state; refuses any subsequent table content/revision change.\ncreate temporary table mnt_expected_cutover_state(suffix text primary key,row_count bigint not null,checksum text not null);\ninsert into pg_temp.mnt_expected_cutover_state values\n${values.join(',\n')};\n`;
  const sql=preamble+await readFile(resolve('tools/fortius-inmuebles-rollback-identity.sql'),'utf8');
  await writeFile(resolve(root,'rollback-identity-guarded.sql'),sql,{flag:'wx'});
  console.log(JSON.stringify({prepared:true,remoteWrites:0,tables:5,artifact:'rollback-identity-guarded.sql'}));
} finally {await db.close();}
