import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ownerExport } from '../../tools/fortius-inmuebles-backup.mjs';
const names=['staff','records','record_references','rate_limits','record_revisions','adviser_accounts','comercial_books','comercial_emissions','comercial_revisions','expedientes','file_uploads','formato_assets','formato_drafts','formato_emissions','lead_conversions','signed_copies','record_history','expediente_actividad'];
const backup=()=>({format:'mnt-owner-export-v1',prefix:'fortius_inmuebles',tables:Object.fromEntries(names.map(n=>['fortius_inmuebles_'+n,[]]))});
test('current owner export includes history and activity and rejects incomplete snapshots',async()=>{
 const sql=await readFile(new URL('../../tools/fortius-inmuebles-owner-export.sql',import.meta.url),'utf8');
 for(const name of names) assert.ok(sql.includes('public.fortius_inmuebles_'+name),name);
 assert.equal(ownerExport(backup()).prefix,'fortius_inmuebles');
 for(const missing of ['record_history','expediente_actividad']){const data=backup();delete data.tables['fortius_inmuebles_'+missing];assert.throws(()=>ownerExport(data),/Incomplete/);}
});
