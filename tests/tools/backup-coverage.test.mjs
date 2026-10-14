import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as tools from '../../tools/fortius-inmuebles-backup.mjs';
const historical=['staff','records','record_references','rate_limits','record_revisions','adviser_accounts','comercial_books','comercial_emissions','comercial_revisions','expedientes','file_uploads','formato_assets','formato_drafts','formato_emissions','lead_conversions','signed_copies','record_history','expediente_actividad'];
const apps=['app_runs','app_run_versions','app_files','app_shares','integration_jobs','integration_artifacts','integration_pages','signature_events'];
const names=[...historical,...apps,"interviews"];
const backup=()=>({format:'mnt-owner-export-v1',prefix:'fortius_inmuebles',schema_version:3,tables:Object.fromEntries(names.map(n=>['fortius_inmuebles_'+n,[]]))});

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
 const old=backup();delete old.schema_version;for(const name of [...apps,'interviews'])delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old);assert.deepEqual(tools.ownerExport(old),original);assert.deepEqual(old,original);
 const partial=structuredClone(old);partial.tables.fortius_inmuebles_app_runs=[];assert.throws(()=>tools.ownerExport(partial),/Incomplete/);
 const future=backup();future.schema_version=4;assert.throws(()=>tools.ownerExport(future),/Unsupported.*schema/i);
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

function restClient(responses) {
 let index=0;
 const calls=[];
 return {calls,from(table){
   const call={table,orders:[]};calls.push(call);
   return {select(){return this;},range(from,to){call.range=[from,to];return this;},order(column){call.orders.push(column);return this;},then(resolve,reject){return Promise.resolve(responses[index++]).then(resolve,reject);}};
 }};
}
test('denied internal ledgers remain explicitly incomplete REST evidence with a complete current owner source',async()=>{
 for(const suffix of ['record_revisions','record_history','lead_conversions']) {
   const source=backup();source.tables['fortius_inmuebles_'+suffix]=[{id:'preserved-owner-row'}];
   const original=JSON.stringify(source);
   const snapshot=await tools.readRestSnapshot(restClient([{error:{code:'42501'}}]),'fortius_inmuebles',suffix,source);
   assert.deepEqual(snapshot,{table:'fortius_inmuebles_'+suffix,complete:false,errorCode:'42501',ownerCovered:true,rows:[]});
   assert.equal(JSON.stringify(source),original);
 }
});
test('REST failures cannot be hidden by an absent, historical, incomplete or wrong owner snapshot',async()=>{
 const historical=backup();historical.schema_version=1;for(const name of [...apps,"interviews"])delete historical.tables['fortius_inmuebles_'+name];
 const missing=backup();delete missing.tables.fortius_inmuebles_app_runs;
 const wrong={format:'mnt-owner-export-v1',prefix:'mnt',tables:Object.fromEntries(tools.suffixes.map(s=>['mnt_'+s,[]]))};
 for(const source of [undefined,historical,missing,wrong])await assert.rejects(tools.readRestSnapshot(restClient([{error:{code:'42501'}}]),'fortius_inmuebles','record_revisions',source));
 for(const code of ['42P01','PGRST205','request-failed','57014'])await assert.rejects(tools.readRestSnapshot(restClient([{error:{code}}]),'fortius_inmuebles','record_revisions',backup()),/REST backup failed/);
 await assert.rejects(tools.readRestSnapshot(restClient([{error:{code:'42501'}}]),'fortius_inmuebles','app_runs',backup()),/REST backup failed/);
});
test('REST snapshot keeps every page in stable key order and fails on a later unexpected read error',async()=>{
 const first=Array.from({length:1000},(_,id)=>({id})),last=[{id:1000}];
 const client=restClient([{data:first},{data:last}]);
 const snapshot=await tools.readRestSnapshot(client,'fortius_inmuebles','app_run_versions',backup());
 assert.equal(snapshot.complete,true);assert.deepEqual(snapshot.rows,[...first,...last]);
 assert.deepEqual(client.calls.map(c=>c.range),[[0,999],[1000,1999]]);
 assert.deepEqual(client.calls.map(c=>c.orders),[['run_id','version'],['run_id','version']]);
 await assert.rejects(tools.readRestSnapshot(restClient([{data:first},{error:{code:'42501'}}]),'fortius_inmuebles','app_run_versions',backup()),/REST backup failed/);
});
