import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as tools from '../../tools/fortius-inmuebles-backup.mjs';
const historical=['staff','records','record_references','rate_limits','record_revisions','adviser_accounts','comercial_books','comercial_emissions','comercial_revisions','expedientes','file_uploads','formato_assets','formato_drafts','formato_emissions','lead_conversions','signed_copies','record_history','expediente_actividad'];
const apps=['app_runs','app_run_versions','app_files','app_shares','integration_jobs','integration_artifacts','integration_pages','signature_events'];
const names=[...historical,...apps];
const backup=()=>({format:'mnt-owner-export-v1',prefix:'fortius_inmuebles',schema_version:2,tables:Object.fromEntries(names.map(n=>['fortius_inmuebles_'+n,[]]))});

test('current owner export includes every app, ledger, document and history table and rejects any omission',async()=>{
 const sql=await readFile(new URL('../../tools/fortius-inmuebles-owner-export.sql',import.meta.url),'utf8');
 for(const name of names) assert.ok(sql.includes('public.fortius_inmuebles_'+name),name);
 assert.equal(tools.ownerExport(backup()).prefix,'fortius_inmuebles');
 assert.deepEqual([...tools.currentSuffixes].sort(),[...names].sort());
 for(const missing of names){const data=backup();delete data.tables['fortius_inmuebles_'+missing];assert.throws(()=>tools.ownerExport(data),/Incomplete/);}
 const stripped=backup();for(const name of apps)delete stripped.tables['fortius_inmuebles_'+name];
 assert.throws(()=>tools.ownerExport(stripped),/Incomplete/,'a versioned current backup cannot be reclassified as historical');
});

test('keeps the complete historical 18-table format unchanged, rejecting partial apps, unknown tables and versions',()=>{
 const old=backup();delete old.schema_version;for(const name of apps)delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old);assert.deepEqual(tools.ownerExport(old),original);assert.deepEqual(old,original);
 const partial=structuredClone(old);partial.tables.fortius_inmuebles_app_runs=[];assert.throws(()=>tools.ownerExport(partial),/Incomplete/);
 const future=backup();future.schema_version=3;assert.throws(()=>tools.ownerExport(future),/Unsupported.*schema/i);
 const extra=backup();extra.tables.fortius_inmuebles_future_table=[];assert.throws(()=>tools.ownerExport(extra),/Unexpected.*table/i);
 for(const prefix of ['mnt','cota'])assert.equal(tools.ownerExport({format:'mnt-owner-export-v1',prefix,tables:Object.fromEntries(tools.suffixes.map(s=>[prefix+'_'+s,[]]))}).prefix,prefix);
});

test('includes the integrations bucket only for Fortius and gives every REST table a stable key',()=>{
 assert.equal(typeof tools.isBackupBucket,'function');
 assert.equal(tools.isBackupBucket('fortius_inmuebles','fortius-app-integrations'),true);
 assert.equal(tools.isBackupBucket('fortius_inmuebles','fortius-inmuebles-private'),true);
 assert.equal(tools.isBackupBucket('fortius_inmuebles','mnt-private'),false);
 assert.equal(tools.isBackupBucket('mnt','fortius-app-integrations'),false);
 for(const name of names)assert.ok(tools.tableOrderKeys(name).length,name);
 assert.deepEqual(tools.tableOrderKeys('app_run_versions'),['run_id','version']);
 assert.deepEqual(tools.tableOrderKeys('signature_events'),['hash']);
 assert.throws(()=>tools.tableOrderKeys('unknown'),/Unknown/i);
});
