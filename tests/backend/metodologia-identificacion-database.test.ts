import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { cumplirArranque } from "../helpers/arranque";

let db: PGlite;
const admin = "53000000-0000-4000-8000-000000000001";
const own = "53000000-0000-4000-8000-000000000002";
const other = "53000000-0000-4000-8000-000000000003";
const exp = "53000000-0000-4000-8000-000000000010";
async function asUser<T>(uid: string | null, action: () => Promise<T>) {
  await db.exec(`set role ${uid ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid ?? ""]);
  try { return await action(); } finally { await db.exec("reset role"); }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${admin}'),('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql") && name < "20261014033544_guided_operations.sql").sort()) {
    await db.exec(await readFile(new URL(file, dir), "utf8"));
  }
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente propio","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}'),
    ('clientes','c-other','{"id":"c-other","nombre":"Cliente ajeno","telefono":"6641234567","tipo":"propietario","asesorId":"other","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values ('${exp}','c-own','own','EXP-OPERACION');`);

  await db.exec(`insert into public.fortius_inmuebles_records(collection,id,data) values
    ('propiedades','legacy-listed','{"slug":"legacy-listed","codigo":"LEGACY-PUB","tipo":"casa","operacion":"venta","asesorId":"own","publicada":true}'),
    ('propiedades','house-a','{"slug":"house-a","codigo":"HOUSE-A","tipo":"casa","operacion":"venta","asesorId":"own","publicada":false}'),
    ('propiedades','house-b','{"slug":"house-b","codigo":"HOUSE-B","tipo":"casa","operacion":"venta","asesorId":"own","publicada":false}');`);
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f>='20261014033544_guided_operations.sql').sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
  // Estas pruebas recorren el flujo con el asesor marcando todo; que ciertas revisiones sean del
  // director (COR-23) se prueba aparte, en staff-scope-database.test.ts.
  await db.exec("alter table public.fortius_inmuebles_expedientes disable trigger fortius_02_guard_director_reviews");
});
afterAll(async () => { await db?.close(); });

const reviewKeys=['identificacion_pld','entrevista','titularidad','perfil','capacidad','privacidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion','opciones','comprador','visitas','oferta','revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo'];
const completeFlow=(): {version:number;ruta:string;estado:string;motivo:string;contraparteExterna:string;resolucion:{tipo:string;fecha:string;motivo:string;siguienteAccion:string;fechaSiguiente:string};requisitos:Record<string,Record<string,unknown>>} =>({version:1,ruta:'captacion',estado:'activa',motivo:'',contraparteExterna:'Contraparte ficticia externa. Documento de prueba v1.',resolucion:{tipo:'aceptada',fecha:'2026-10-14',motivo:'Admisión de prueba documentada',siguienteAccion:'Seguimiento de prueba',fechaSiguiente:'2030-12-31'},requisitos:Object.fromEntries(reviewKeys.map(k=>[k,{estado:'revisado',soporte:'Soporte ficticio v1 revisado para el ensayo',evidencia:{tipo:'externa',referencia:'Documento externo sintético · versión 1',fecha:'2026-10-14',responsable:'Revisor de ensayo',resultado:'Revisión dentro del alcance de prueba'},...(['factibilidad','revision_cierre'].includes(k)?{vigenteHasta:'2030-12-31'}:{})}]))});
async function fixture(flow:Record<string,unknown>=completeFlow(),slug='house-a') {
 const id=crypto.randomUUID();
 await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,propiedad_slug,flujo) values($1,'c-own','own',$2,$3::jsonb)",[id,slug,JSON.stringify(flow)]);
 // SEG-M2: la operación completa ya tiene 02 y 04 emitidos y el checklist completo.
 await cumplirArranque(db,id,own);
 const task={id:'next-'+id,titulo:'Siguiente acción ficticia',categoria:'documentacion',estado:'pendiente',prioridad:'normal',pasos:[],asesorId:'own',clienteId:'c-own',propiedadSlug:slug,expedienteId:id,vence:'2030-12-31'};
 await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,null)",[task.id,JSON.stringify(task)]);
 return {id,task};
}
async function update(id:string,stage:string,flow:Record<string,unknown>|null=null,slug?:string) {
 const version=(await db.query<{version:number}>('select version from public.fortius_inmuebles_expedientes where id=$1',[id])).rows[0].version;
 return (await db.query<{r:Record<string,unknown>}>("select public.fortius_inmuebles_update_operation($1,$2,$3,null,'{}'::jsonb,$4::jsonb,$5,$6) r",[id,version,stage,flow?JSON.stringify(flow):null,slug??null,slug!==undefined])).rows[0].r;
}
/** Sube a los documentos del cliente un contrato ficticio de la operación (como superusuario de la prueba). */
async function clientFile(id:string){
 const file=crypto.randomUUID();
 await db.exec('reset role');
 await db.query("insert into public.fortius_inmuebles_expediente_archivos(id,expediente_id,titulo,nombre_original,mime,byte_length,sha256,path,uploaded_by) values($1,$2,'Contrato ficticio firmado','contrato.pdf','application/pdf',1000,$3,$4,$5)",[file,id,'a'.repeat(64),`${id}/cliente/${file}.pdf`,own]);
 await db.exec('set role authenticated');
 return file;
}
const signature=(archivo:string,patch:Record<string,unknown>={})=>({tipo:'intermediacion',fecha:'2026-11-10',firmantes:[{nombre:'Cliente propio',parte:'propietario'},{nombre:'Ana',parte:'fortius'}],archivo,completa:true,revisada:false,...patch});
async function asAdmin<T>(action:()=>Promise<T>){
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);
 try{return await action();}finally{await db.query("select set_config('request.jwt.claim.sub',$1,false)",[own]);}
}
/** COR-10: el asesor registra la firma del contrato y el director la marca revisada. */
async function sign(id:string,stage:string){
 const firma=signature(await clientFile(id));
 await update(id,stage,{...completeFlow(),firmaContrato:firma});
 return asAdmin(()=>update(id,stage,{...completeFlow(),firmaContrato:{...firma,revisada:true}}));
}
const required=async(route:string,stage:string)=>(await db.query<{k:string[]}>("select public.fortius_inmuebles_flow_required($1,$2) k",[route,stage])).rows[0].k;
const without=(key:string)=>{const f=completeFlow();delete f.requisitos[key];return f;};
const flowOf=async(id:string)=>(await db.query<{flujo:{requisitos:Record<string,{estado:string}>}}>("select flujo from public.fortius_inmuebles_expedientes where id=$1",[id])).rows[0].flujo;

/*
  Metodología M-05 (decisión del titular, 14/11/2026): el expediente de identificación de la
  LFPIORPI (art. 18) se exige antes de pasar a la firma en la compraventa. Es protegido: no admite
  excepción ni «no aplica». Cada operación identifica a su cliente, así que cambiar la contraparte
  no lo reinicia. La renta no lo pide: la intermediación de la fr. V del art. 17 es de
  compraventa.
*/
it('requires the identification file to enter closing in a sale, not before and not in rentals',async()=>{
 for(const route of ['captacion','compra']){
  expect(await required(route,'cierre')).toContain('identificacion_pld');
  expect(await required(route,'negociacion')).not.toContain('identificacion_pld');
 }
 expect(await required('arrendador','cierre')).not.toContain('identificacion_pld');
 expect(await required('arrendatario','cierre')).not.toContain('identificacion_pld');
});
it('blocks signing until the identification file is reviewed',async()=>{
 await asUser(own,async()=>{
  const {id}=await fixture();
  await update(id,'documentacion');await sign(id,'documentacion');await update(id,'comercializacion');await update(id,'negociacion');
  const firmaContrato=(await db.query<{f:unknown}>("select flujo->'firmaContrato' f from public.fortius_inmuebles_expedientes where id=$1",[id])).rows[0].f;
  const pendiente=completeFlow();pendiente.requisitos.identificacion_pld={estado:'recibido',soporte:'Faltan las identificaciones'};
  await update(id,'negociacion',{...pendiente,firmaContrato});
  await expect(update(id,'cierre')).rejects.toThrow(/identificacion_pld/);
  await update(id,'negociacion',{...completeFlow(),firmaContrato});
  await update(id,'cierre');
  expect((await db.query<{etapa:string}>('select etapa from public.fortius_inmuebles_expedientes where id=$1',[id])).rows[0].etapa).toBe('cierre');
 });
});
it('admits neither an exception nor «no aplica» for the identification file',async()=>{
 await asUser(own,async()=>{
  const {id}=await fixture(without('identificacion_pld'));
  const noAplica=completeFlow();noAplica.requisitos.identificacion_pld={estado:'no_aplica',soporte:'El cliente no quiso dar sus datos'};
  await expect(update(id,'captacion',noAplica)).rejects.toThrow(/no admite no aplicabilidad/);
  // La excepción la revisa el guardián de las revisiones del director, que el resto de la prueba apaga.
  await db.exec('reset role');await db.exec('alter table public.fortius_inmuebles_expedientes enable trigger fortius_02_guard_director_reviews');await db.exec('set role authenticated');
  const excepcion=completeFlow();excepcion.requisitos.identificacion_pld={estado:'recibido',soporte:'Pendiente',excepcion:{motivo:'El director lo autoriza sin expediente'}};
  await expect(update(id,'captacion',excepcion)).rejects.toThrow(/no admite excepción/);
  await db.exec('reset role');await db.exec('alter table public.fortius_inmuebles_expedientes disable trigger fortius_02_guard_director_reviews');await db.exec('set role authenticated');
 });
});
it('keeps the client identification when only the counterpart changes',async()=>{
 await asUser(own,async()=>{
  const {id}=await fixture();
  await update(id,'captacion',{...completeFlow(),contraparteExterna:'Otro comprador ficticio externo. Documento de prueba v2.'});
  const flujo=await flowOf(id);
  expect(flujo.requisitos.identificacion_pld.estado).toBe('revisado');
  expect(flujo.requisitos.oferta.estado).toBe('recibido');
  expect(flujo.requisitos.titularidad.estado).toBe('revisado');
 });
});
