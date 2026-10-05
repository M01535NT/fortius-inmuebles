import { afterAll,beforeAll,expect,it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile,readdir } from "node:fs/promises";
import { emptyComercialBook,newOpportunity } from "@/lib/comercial/types";
let db:PGlite; const admin="61000000-0000-4000-8000-000000000001",editor="61000000-0000-4000-8000-000000000002",id="61000000-0000-4000-8000-000000000003";
async function asUser<T>(uid:string|null,action:()=>Promise<T>) { await db.exec(`set role ${uid?"authenticated":"anon"}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid??""]);try{return await action();}finally{await db.exec("reset role");} }
beforeAll(async()=>{
 db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated,service_role;grant all on storage.objects to anon,authenticated,service_role;insert into auth.users values('${admin}'),('${editor}');`);
 const dir=new URL("../../supabase/migrations/",import.meta.url);for(const f of (await readdir(dir)).filter(f=>f.endsWith(".sql")).sort())await db.exec(await readFile(new URL(f,dir),"utf8"));
 await db.exec(`insert into public.mnt_staff(user_id,role) values('${admin}','admin'),('${editor}','editor');`);
});
afterAll(async()=>{await db?.close();});
it("admin guarda; editor/anon no leen ni escriben cartera o revisiones",async()=>{
 await asUser(admin,async()=>{await db.query("insert into mnt_comercial_books(id,nombre,data,created_by) values($1,'Cartera',$2,$3)",[id,JSON.stringify(emptyComercialBook()),admin]);expect((await db.query("select version from mnt_comercial_revisions where book_id=$1",[id])).rows).toEqual([{version:1}]);});
 await asUser(editor,async()=>{expect((await db.query("select * from mnt_comercial_books")).rows).toEqual([]);expect((await db.query("select * from mnt_comercial_revisions")).rows).toEqual([]);await expect(db.query("insert into mnt_comercial_books(nombre,data,created_by) values('Ajeno',$1,$2)",[JSON.stringify(emptyComercialBook()),editor])).rejects.toMatchObject({code:"42501"});});
 await asUser(null,async()=>{await expect(db.query("select * from mnt_comercial_books")).rejects.toMatchObject({code:"42501"});});
});
it("rechaza versión obsoleta, elimina historia y modificaciones de revisiones",async()=>{
 await asUser(admin,async()=>{
  const b=emptyComercialBook();b.oportunidades=[newOpportunity("I1","Inmueble")]; await db.query("update mnt_comercial_books set data=$1,version=2 where id=$2",[JSON.stringify(b),id]);
  await expect(db.query("update mnt_comercial_books set version=2 where id=$1",[id])).rejects.toMatchObject({code:"PT409"});
  await expect(db.query("update mnt_comercial_books set data=$1,version=3 where id=$2",[JSON.stringify(emptyComercialBook()),id])).rejects.toMatchObject({code:"PT403"});
  await expect(db.query("delete from mnt_comercial_revisions where book_id=$1",[id])).rejects.toMatchObject({code:"42501"});
 });
 await expect(db.query("update mnt_comercial_revisions set nombre='Cambio' where book_id=$1",[id])).rejects.toMatchObject({code:"PT403"});
});
it("rechaza expediente inexistente e IDs duplicados; bucket no expone PDF",async()=>{
 await asUser(admin,async()=>{const b=emptyComercialBook();b.oportunidades=[newOpportunity("I1","Inmueble")];b.oportunidades[0].gestion.expediente="61000000-0000-4000-8000-000000000099";
 await expect(db.query("update mnt_comercial_books set data=$1,version=3 where id=$2",[JSON.stringify(b),id])).rejects.toMatchObject({code:"PT400"});
 b.oportunidades[0].gestion.expediente="";b.oportunidades.push({...b.oportunidades[0]});await expect(db.query("update mnt_comercial_books set data=$1,version=3 where id=$2",[JSON.stringify(b),id])).rejects.toMatchObject({code:"PT400"});});
 expect((await db.query("select public from storage.buckets where id='mnt-comercial'")).rows).toEqual([{public:false}]);
 await db.exec("insert into storage.objects(bucket_id,name) values('mnt-comercial','private.pdf')"); await asUser(editor,async()=>expect((await db.query("select name from storage.objects where bucket_id='mnt-comercial'")).rows).toEqual([]));
});
it("conserva eventos y documentos en SQL y archiva sólo una instantánea exacta",async()=>{
 await asUser(admin,async()=>{const b=emptyComercialBook();b.oportunidades=[newOpportunity("I1","Inmueble")];b.eventos=[{id:"E1",oportunidad:"I1",fecha:"",actividad:"Otro",detalle:"Dato",importe:null,moneda:"",estado:"Registrado",responsable:"",evidencia:"",base:"Declarado",anterior:""}];b.documentos=[{id:"D1",oportunidad:"I1",nombre:"Escritura",aplicabilidad:"Por definir",estado:"Pendiente",fuente:"",fecha:"",responsable:"",observacion:"",anterior:""}];await db.query("update mnt_comercial_books set data=$1,version=3 where id=$2",[JSON.stringify(b),id]);
  const next=structuredClone(b);next.eventos[0].detalle="Cambio";await expect(db.query("update mnt_comercial_books set data=$1,version=4 where id=$2",[JSON.stringify(next),id])).rejects.toMatchObject({code:"PT403"});next.eventos=b.eventos;next.documentos=[];await expect(db.query("update mnt_comercial_books set data=$1,version=4 where id=$2",[JSON.stringify(next),id])).rejects.toMatchObject({code:"PT403"});
 });
 const emission="61000000-0000-4000-8000-000000000004";const revision=(await db.query<{data:unknown}>("select data from mnt_comercial_revisions where book_id=$1 and version=3",[id])).rows[0];
 await db.query("insert into mnt_comercial_emissions(id,book_id,book_version,snapshot,sha256,path,created_by) values($1,$2,3,$3,$4,$5,$6)",[emission,id,JSON.stringify({nombre:"Cartera",data:revision.data}),"a".repeat(64),`${id}/${emission}.pdf`,admin]);
 await expect(db.query("update mnt_comercial_emissions set sha256=$1 where id=$2",["b".repeat(64),emission])).rejects.toMatchObject({code:"PT403"});await asUser(editor,async()=>expect((await db.query("select * from mnt_comercial_emissions")).rows).toEqual([]));
});
