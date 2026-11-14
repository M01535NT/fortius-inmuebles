import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { cumplirArranque } from "../helpers/arranque";

let db: PGlite;
const admin = "52000000-0000-4000-8000-000000000001";
const own = "52000000-0000-4000-8000-000000000002";
const other = "52000000-0000-4000-8000-000000000003";
const exp = "52000000-0000-4000-8000-000000000010";
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

const reviewKeys=['entrevista','titularidad','perfil','capacidad','privacidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion','opciones','comprador','visitas','oferta','revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo'];
const completeFlow=(): {version:number;ruta:string;estado:string;motivo:string;contraparteExterna:string;resolucion:{tipo:string;fecha:string;motivo:string;siguienteAccion:string;fechaSiguiente:string};requisitos:Record<string,Record<string,unknown>>} =>({version:1,ruta:'captacion',estado:'activa',motivo:'',contraparteExterna:'Contraparte ficticia externa. Documento de prueba v1.',resolucion:{tipo:'aceptada',fecha:'2026-10-14',motivo:'Admisión de prueba documentada',siguienteAccion:'Seguimiento de prueba',fechaSiguiente:'2030-12-31'},requisitos:Object.fromEntries(reviewKeys.map(k=>[k,{estado:'revisado',soporte:'Soporte ficticio v1 revisado para el ensayo',evidencia:{tipo:'externa',referencia:'Documento externo sintético · versión 1',fecha:'2026-10-14',responsable:'Revisor de ensayo',resultado:'Revisión dentro del alcance de prueba'},...(['factibilidad','revision_cierre'].includes(k)?{vigenteHasta:'2030-12-31'}:{})}]))});
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
/** COR-17: el avalúo que trae el propietario respalda el valor mientras está vigente. */
const listing=(slug:string,extra:Record<string,unknown>={})=>({slug,codigo:slug.toUpperCase(),titulo:'Casa ficticia de ensayo',tipo:'casa',operacion:'venta',precio:{modalidad:'consulta'},zona:'Prueba',direccionAproximada:'Prueba',descripcion:['Prueba'],ficha:{},amenidades:[],galeria:[{src:'/hero/casa-playa.webp',alt:'Prueba'}],asesorId:'own',creditoDisponible:false,puntosDeInteres:[],destacada:false,estado:'disponible',publicadaEl:'2026-10-13',demo:true,publicada:true,...extra});
async function putListing(slug:string,data:Record<string,unknown>){
 const version=(await db.query<{version:number}>("select version from public.fortius_inmuebles_records where collection='propiedades' and id=$1",[slug])).rows[0]?.version??null;
 return db.query("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3)",[slug,JSON.stringify(data),version]);
}
/** Cambia de usuario sin salir del rol `authenticated`. */
const actAs=(uid:string)=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
const published=async(slug:string)=>(await db.query<{p:boolean}>("select (data->>'publicada')::boolean p from public.fortius_inmuebles_records where collection='propiedades' and id=$1",[slug])).rows[0].p;

/*
  Metodología (M-01, M-02): el inmueble publicado sale del sitio cuando la captación deja de
  autorizarlo. Ya pasaba al pausar, descartar o retirar una revisión; faltaba cuando el contrato de
  intermediación termina o se corrige (vuelve a «por revisar») y cuando la operación se regresa a
  una etapa anterior a la publicación.
*/
/*
  M-04 (decisiones del titular, 14/11/2026): el director pasa una operación a otro asesor.
  1) Lo revisado se queda aprobado; la firma y la publicación también.
  2) Las demás operaciones abiertas del inmueble pasan juntas; el inmueble y el cliente, también.
  3) Para comisiones, «captó» sigue siendo el asesor de antes (flujo.captadoPor).
  Las tareas abiertas pasan al asesor nuevo; las terminadas conservan a quien las hizo.
*/
type Flow={requisitos:Record<string,{estado:string;registradoPor?:string}>;firmaContrato:{revisada:boolean};captadoPor?:string};
const row=async(id:string)=>(await db.query<{asesor_id:string;flujo:Flow}>("select asesor_id,flujo from public.fortius_inmuebles_expedientes where id=$1",[id])).rows[0];
const recordOf=async(collection:string,id:string)=>(await db.query<{data:Record<string,unknown>}>("select data from public.fortius_inmuebles_records where collection=$1 and id=$2",[collection,id])).rows[0].data;
const reassign=(id:string,asesor:string,motivo='El asesor se dio de baja del equipo')=>db.query<{r:{movidas:string[]}}>("select public.fortius_inmuebles_reassign_operation($1,$2,$3) r",[id,asesor,motivo]);
async function cliente(id:string,asesor='own'){
 await db.exec('reset role');
 await db.query("insert into public.fortius_inmuebles_records(collection,id,data) values('clientes',$1,$2::jsonb)",[id,JSON.stringify({id,nombre:'Cliente ficticio '+id,telefono:'6641234567',tipo:'propietario',asesorId:asesor,notas:'',creadoEl:'2026-11-01',actualizadoEl:'2026-11-01'})]);
 await db.exec('set role authenticated');
}
/** Operación publicada en negociación con su propio cliente, para no cruzarse con las demás pruebas. */
async function scenario(slug:string){
 const client='c-'+slug;
 await cliente(client);
 await db.exec('reset role');
 await db.query("insert into public.fortius_inmuebles_records(collection,id,data) values('propiedades',$1,$2::jsonb)",[slug,JSON.stringify({slug,codigo:slug.toUpperCase(),tipo:'casa',operacion:'venta',asesorId:'own',publicada:false})]);
 await db.exec('set role authenticated');
 const id=crypto.randomUUID();
 await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,propiedad_slug,flujo) values($1,$2,'own',$3,$4::jsonb)",[id,client,slug,JSON.stringify(completeFlow())]);
 await cumplirArranque(db,id,own);
 const task={id:'next-'+id,titulo:'Siguiente acción ficticia',categoria:'documentacion',estado:'pendiente',prioridad:'normal',pasos:[],asesorId:'own',clienteId:client,propiedadSlug:slug,expedienteId:id,vence:'2030-12-31'};
 await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,null)",[task.id,JSON.stringify(task)]);
 await update(id,'documentacion');await sign(id,'documentacion');await update(id,'comercializacion');
 await actAs(admin);await putListing(slug,listing(slug));await actAs(own);
 await update(id,'negociacion');
 expect(await published(slug)).toBe(true);
 return id;
}
it('keeps every review, the signature and the listing when the director reassigns (M-04)',async()=>{
 await asUser(own,async()=>{
  const id=await scenario('m04-sigue');
  const done={id:'done-'+id,titulo:'Visita hecha',categoria:'documentacion',estado:'completada',prioridad:'normal',pasos:[],asesorId:'own',clienteId:'c-m04-sigue',propiedadSlug:'m04-sigue',expedienteId:id,vence:'2026-11-01'};
  await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,null)",[done.id,JSON.stringify(done)]);
  const before=await row(id);
  await actAs(admin);
  const moved=(await reassign(id,'other')).rows[0].r.movidas;
  expect(moved).toEqual([id]);
  const after=await row(id);
  expect(after.asesor_id).toBe('other');
  for(const [k,r] of Object.entries(before.flujo.requisitos)){expect(after.flujo.requisitos[k].estado,k).toBe(r.estado);expect(after.flujo.requisitos[k].registradoPor,k).toBe(r.registradoPor);}
  expect(after.flujo.firmaContrato.revisada).toBe(true);
  expect(after.flujo.captadoPor).toBe('own');
  expect(await published('m04-sigue')).toBe(true);
  expect((await recordOf('propiedades','m04-sigue')).asesorId).toBe('other');
  expect((await recordOf('clientes','c-m04-sigue')).asesorId).toBe('other');
  expect((await recordOf('tareas','next-'+id)).asesorId).toBe('other');
  expect((await recordOf('tareas','done-'+id)).asesorId).toBe('own');
  const notes=(await db.query<{descripcion:string;created_by:string}>("select descripcion,created_by from public.fortius_inmuebles_expediente_actividad where expediente_id=$1 and tipo='nota'",[id])).rows;
  expect(notes).toEqual([expect.objectContaining({created_by:admin,descripcion:expect.stringContaining('El asesor se dio de baja del equipo')})]);
  // Una segunda reasignación conserva al que captó primero.
  await reassign(id,'own','Regresa con el asesor que la captó');
  expect((await row(id)).flujo.captadoPor).toBe('own');
  await actAs(own);
 });
});
it('moves every open operation of the property together (M-04)',async()=>{
 await asUser(own,async()=>{
  const id=await scenario('m04-juntas');
  const second=crypto.randomUUID();
  await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,propiedad_slug,flujo) values($1,'c-m04-juntas','own','m04-juntas',$2::jsonb)",[second,JSON.stringify(completeFlow())]);
  await actAs(admin);
  const moved=(await reassign(id,'other')).rows[0].r.movidas;
  expect([...moved].sort()).toEqual([id,second].sort());
  expect((await row(second)).asesor_id).toBe('other');
  await actAs(own);
 });
});
it('only the director reassigns, with a reason, to an active advisor, and the client must move whole (M-04)',async()=>{
 await asUser(own,async()=>{
  const id=await scenario('m04-reglas');
  await expect(reassign(id,'other')).rejects.toMatchObject({code:'PT403'});
  await actAs(admin);
  await expect(reassign(id,'other','corto')).rejects.toMatchObject({code:'PT400'});
  await expect(reassign(id,'nadie')).rejects.toMatchObject({code:'PT400'});
  await expect(reassign(id,'own')).rejects.toMatchObject({code:'PT400'});
  // El cliente tiene otra operación abierta en otro inmueble: el acceso es por cliente, no se parte.
  const elsewhere=crypto.randomUUID();
  await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,flujo) values($1,'c-m04-reglas','own',$2::jsonb)",[elsewhere,JSON.stringify(completeFlow())]);
  await expect(reassign(id,'other')).rejects.toMatchObject({code:'PT409'});
  expect((await row(id)).asesor_id).toBe('own');
  await actAs(own);
 });
});
it('does not let anyone write the original captor by hand (M-04)',async()=>{
 await asUser(own,async()=>{
  const id=await scenario('m04-captor');
  const flujo=(await row(id)).flujo;
  await expect(update(id,'negociacion',{...flujo,captadoPor:'other'})).rejects.toMatchObject({code:'PT403'});
  expect((await row(id)).flujo.captadoPor).toBeUndefined();
  await expect(db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,flujo) values($1,'c-m04-captor','own',$2::jsonb)",[crypto.randomUUID(),JSON.stringify({...completeFlow(),captadoPor:'other'})])).rejects.toMatchObject({code:'PT403'});
  // Ya reasignada, un guardado que lo omite lo conserva y uno que lo cambia se rechaza.
  await actAs(admin);await reassign(id,'other');
  const moved=(await row(id)).flujo;
  const {captadoPor:_omit,...without}=moved;void _omit;
  await update(id,'negociacion',without);
  expect((await row(id)).flujo.captadoPor).toBe('own');
  await expect(update(id,'negociacion',{...moved,captadoPor:'other'})).rejects.toMatchObject({code:'PT403'});
  await actAs(own);
 });
});
