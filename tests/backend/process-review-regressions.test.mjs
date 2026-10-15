import {beforeAll,afterAll,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createRehearsalDatabase} from '../../tools/fortius-inmuebles-restore-current.mjs';
import {startIntakeSchema} from '../../src/lib/intake/interview';
let db;
const user='66000000-0000-4000-8000-000000000001';
const q=async(sql,args=[])=> (await db.query(sql,args)).rows;
beforeAll(async()=>{ db=await createRehearsalDatabase();

await db.exec(`insert into auth.users values('${user}'); insert into public.fortius_inmuebles_staff(user_id,role) values('${user}','admin'); insert into public.fortius_inmuebles_records(collection,id,data) values('asesores','critic-adviser','{"id":"critic-adviser","nombre":"Asesor sintético","cargo":"Asesor","iniciales":"AS","activo":true}'); set role authenticated;`);
await q("select set_config('request.jwt.claim.sub',$1,false)",[user]);
}); afterAll(async()=>{await db?.close();});
const answers={fecha:'2026-10-14',objetivo:'Evaluar el inmueble',plazo:'Tres meses',zona:'Tijuana',tipoInmueble:'casa',presupuestoEstado:'conocido',importe:'8000000',moneda:'MXN',privacidad:'presentado',siguienteAccion:'Revisar antecedentes',siguienteFecha:'2030-12-31',relacion:'propietario',ocupacion:'por_aclarar',documentos:'Por aclarar',alertas:'por_aclarar',estadoCivil:'soltero',ubicacion:'Domicilio original de ensayo'};
async function start(intent='vender',contact,exp=null){return (await q('select public.fortius_inmuebles_start_intake($1,$2,$3::jsonb,$4) r',[randomUUID(),intent,JSON.stringify(exp ? contact : {seguimiento:{origen:'llamada',accion:'Revisar antecedentes',fecha:'2030-12-31'},...(contact??{tipo:'nuevo',nombre:'Persona sintética',telefono:'6649988776',email:'',asesorId:'critic-adviser',telefonoCompartido:true})}),exp]))[0].r;}
async function complete(id,a=answers){return (await q('select public.fortius_inmuebles_save_intake($1,1,$2::jsonb,true) r',[id,JSON.stringify(a)]))[0].r;}
async function row(id){return (await q('select * from public.fortius_inmuebles_expedientes where id=$1',[id]))[0];}
async function update(id,flow,stage){let e=await row(id);return (await q("select public.fortius_inmuebles_update_operation($1,$2,$3,null,'{}'::jsonb,$4::jsonb,null,false) r",[id,e.version,stage??e.etapa,JSON.stringify(flow)]))[0].r;}
const ext={tipo:'externa',referencia:'Revisión externa sintética versión 1',fecha:'2026-10-14',responsable:'Responsable sintético',resultado:'Conforme para el contexto original'};
async function authorize(id){let e=await row(id);let flow=e.flujo;for(const k of ['titularidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion'])flow.requisitos[k]={estado:'revisado',soporte:'Revisión sintética del contexto original',evidencia:ext,...(k==='factibilidad'?{vigenteHasta:'2030-12-31'}:{})};flow.resolucion={tipo:'aceptada',fecha:'2026-10-14',motivo:'Autorización del contexto original',siguienteAccion:'Revisar antecedentes',fechaSiguiente:'2030-12-31'};return update(id,flow,'comercializacion');}
async function prop(id){return (await q("select data,version from public.fortius_inmuebles_records where collection='propiedades' and id=$1",[id]))[0];}
async function publish(id){let p=await prop(id);await q("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3)",[id,JSON.stringify({...p.data,estado:'disponible',publicadaEl:'2026-10-14',demo:true,publicada:true,galeria:[{src:'/hero/casa-playa.webp',alt:'Fotografía sintética'}]}),p.version]);}
async function ready(id){await db.exec('reset role');try{return (await q('select public.fortius_inmuebles_flow_publish_ready($1) ready',[id]))[0].ready;}finally{await db.exec('set role authenticated');}}

it('invalidates dependent conclusions after a material correction and withdraws publication while preserving prior interview',async()=>{
 const done=await complete((await start()).id);await authorize(done.expediente_id);await publish(done.propiedad_slug);
 const correction=await start('vender',{tipo:'cliente',id:done.cliente_id},done.expediente_id);
 await complete(correction.id,{...answers,ubicacion:'OTRO domicilio material',importe:'9500000',alertas:'declaradas',detalleAlertas:'Conflicto de titularidad declarado'});
 const after=await row(done.expediente_id);
 expect(after.flujo.requisitos.titularidad.estado).toBe('recibido');expect(after.flujo.requisitos.precio.estado).toBe('recibido');
 expect(after.flujo.resolucion).toBeUndefined();expect(await ready(done.expediente_id)).toBe(false);
 expect((await prop(done.propiedad_slug)).data.publicada).toBe(false);
 expect((await q('select respuestas from public.fortius_inmuebles_interviews where id=$1',[done.id]))[0].respuestas.importe).toBe('8000000');
});
it('does not retain sale publication on the strength of a different rent authorization',async()=>{
 const done=await complete((await start()).id);await authorize(done.expediente_id);await publish(done.propiedad_slug);
 const rent=await complete((await start('arrendar',{tipo:'cliente',id:done.cliente_id})).id,{...answers,propiedadExistente:done.propiedad_slug});await authorize(rent.expediente_id);
 let sale=await row(done.expediente_id);sale.flujo.resolucion={...sale.flujo.resolucion,tipo:'pausada',motivo:'Suspender la venta',siguienteAccion:'Atender pausa'};await update(sale.id,sale.flujo);
 expect(await ready(rent.expediente_id)).toBe(true);expect(await ready(sale.id)).toBe(false);
 expect((await prop(done.propiedad_slug)).data.publicada).toBe(false);
});
it('requires initial origin and dated followup in API and SQL while allowing corrections without a new initial task',async()=>{
 const contact={tipo:'nuevo',nombre:'Sin seguimiento',telefono:'6643344556',email:'',asesorId:'critic-adviser',telefonoCompartido:true};
 expect(startIntakeSchema.safeParse({id:randomUUID(),intencion:'vender',contacto:contact}).success).toBe(false);
 await expect(q('select public.fortius_inmuebles_start_intake($1,$2,$3::jsonb,null)',[randomUUID(),'vender',JSON.stringify(contact)])).rejects.toMatchObject({code:'PT400'});
 expect(startIntakeSchema.safeParse({id:randomUUID(),intencion:'vender',contacto:{tipo:'cliente',id:'existing'},expedienteId:randomUUID()}).success).toBe(true);
});
