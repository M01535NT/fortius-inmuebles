import { afterAll, beforeAll, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
// @ts-expect-error Isolated database helper is JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";

let db: PGlite;
const user = "66000000-0000-4000-8000-000000000001";
beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${user}');
    insert into public.fortius_inmuebles_staff(user_id,role) values ('${user}','admin');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','process-adviser','{"id":"process-adviser","nombre":"Asesor de prueba","cargo":"Asesor","iniciales":"AP","activo":true}');
    set role authenticated;`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
});
afterAll(async () => { await db?.close(); });

const answers = (type = "casa") => ({ fecha: "2026-10-14", objetivo: "Evaluar el inmueble", plazo: "Tres meses", zona: "Tijuana", tipoInmueble: type, presupuestoEstado: "por_definir", privacidad: "presentado", siguienteAccion: "Revisar antecedentes", siguienteFecha: "2030-12-31", relacion: "propietario", ocupacion: "por_aclarar", documentos: "Por aclarar", alertas: "por_aclarar", estadoCivil: "soltero", ubicacion: "Ubicación sintética inicial" });
async function start(intent = "vender", contact?: Record<string, unknown>, exp: string | null = null) {
  return (await db.query<{ r: Record<string, unknown> }>("select public.fortius_inmuebles_start_intake($1,$2,$3::jsonb,$4) r", [crypto.randomUUID(), intent, JSON.stringify(exp ? contact : { seguimiento: {origen:"llamada",accion:"Revisar antecedentes",fecha:"2030-12-31"}, ...(contact ?? { tipo: "nuevo", nombre: "Persona sintética", telefono: "6649988776", email: "", asesorId: "process-adviser", telefonoCompartido: true }) }), exp])).rows[0].r;
}
async function complete(id: unknown, data: Record<string, string> = answers()) {
  return (await db.query<{ r: Record<string, unknown> }>("select public.fortius_inmuebles_save_intake($1,1,$2::jsonb,true) r", [id, JSON.stringify(data)])).rows[0].r;
}
/** El primer contacto deja la operación en captación (26/10/2026); el panel la pasa a documentación como cualquier avance. */
async function admit<T extends Record<string, unknown>>(done: T) {
  const current = (await db.query<{ version: number }>("select version from public.fortius_inmuebles_expedientes where id=$1", [done.expediente_id])).rows[0];
  await db.query("select public.fortius_inmuebles_update_operation($1,$2,'documentacion',null,'{}'::jsonb,null,null,false)", [done.expediente_id, current.version]);
  return done;
}
async function property(slug: unknown) {
  return (await db.query<{ data: Record<string, unknown>; version: number }>("select data,version from public.fortius_inmuebles_records where collection='propiedades' and id=$1", [slug])).rows[0];
}
it("corrects location atomically while retaining the earlier interview and current evidence", async () => {
  const first = await start(), done = await complete(first.id);
  const correction = await start("vender", { tipo: "cliente", id: done.cliente_id }, done.expediente_id as string);
  const fixed = await complete(correction.id, { ...answers(), ubicacion: "Ubicación sintética corregida" });
  const exp = (await db.query<{ unidad: string; flujo: { requisitos: { entrevista: { soporte: string } } } }>("select unidad,flujo from public.fortius_inmuebles_expedientes where id=$1", [done.expediente_id])).rows[0];
  expect(exp.unidad).toBe("Ubicación sintética corregida");
  expect(exp.flujo.requisitos.entrevista.soporte).toContain(String(fixed.id));
  expect((await db.query<{ respuestas: { ubicacion: string } }>("select respuestas from public.fortius_inmuebles_interviews where id=$1", [first.id])).rows[0].respuestas.ubicacion).toBe("Ubicación sintética inicial");
});
it("registers an owner property for evaluation without commercial availability or a publication date", async () => {
  const done = await complete((await start()).id);
  expect((await property(done.propiedad_slug)).data).toMatchObject({ estado: "evaluacion", publicada: false, publicadaEl: "" });
});
it.each([ ["vender", "terreno"], ["arrendar", "local"] ])("requires capture authorization before publishing %s %s", async (intent, type) => {
  const done = await complete((await start(intent)).id, answers(type));
  const p = await property(done.propiedad_slug);
  await expect(db.query("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3)", [done.propiedad_slug, JSON.stringify({ ...p.data, estado: "disponible", publicadaEl: "2026-10-14", demo: true, publicada: true, galeria: [{ src: "/hero/casa-playa.webp", alt: "Fotografía sintética" }] }), p.version])).rejects.toMatchObject({ code: "PT409" });
  expect((await property(done.propiedad_slug)).data.publicada).toBe(false);
});
it("prevents a rent from jumping to archive while its evidence and tasks remain pending", async () => {
  const done = await complete((await start("arrendar")).id);
  await expect(db.query("update public.fortius_inmuebles_expedientes set etapa='cerrado',version=version+1 where id=$1", [done.expediente_id])).rejects.toMatchObject({ code: "PT409" });
  expect((await db.query<{ etapa: string }>("select etapa from public.fortius_inmuebles_expedientes where id=$1", [done.expediente_id])).rows[0].etapa).toBe("captacion");
});
it("saves an email-only first contact with origin and action, then reuses its open task", async () => {
  const first = await start("vender", { tipo: "nuevo", nombre: "Contacto por correo", telefono: "", email: "contacto@example.invalid", asesorId: "process-adviser", telefonoCompartido: false, seguimiento: { origen: "correo", accion: "Revisar antecedentes", fecha: "2030-12-31" } });
  expect(first.respuestas).toMatchObject({ origenContacto: "correo", siguienteAccion: "Revisar antecedentes", siguienteFecha: "2030-12-31" });
  expect((await db.query("select id from public.fortius_inmuebles_records where collection='tareas' and data->>'leadId'=$1", [first.lead_id])).rows).toHaveLength(1);
  const done = await complete(first.id);
  expect((done.respuestas as Record<string,string>).origenContacto).toBe("correo");
  expect((await db.query("select id from public.fortius_inmuebles_records where collection='tareas' and data->>'expedienteId'=$1", [done.expediente_id])).rows).toHaveLength(1);
});
it("suggests an existing email contact instead of creating a duplicate identity",async()=>{
 const contact={tipo:"nuevo",nombre:"Contacto de correo único",telefono:"",email:"unico@example.invalid",asesorId:"process-adviser",telefonoCompartido:false};
 await start("vender",contact);
 await expect(start("arrendar",contact)).rejects.toMatchObject({code:"PT409"});
});
it("prefills the initial person's declared profile without copying later engagements over it",async()=>{
 const first=await complete((await start()).id,{...answers(),presupuestoEstado:"conocido",importe:"8000000",moneda:"MXN"});
 const current=(await db.query<{data:{perfil:Record<string,unknown>}}>("select data from public.fortius_inmuebles_records where collection='clientes' and id=$1",[first.cliente_id])).rows[0];
 expect(current.data.perfil).toMatchObject({operacion:"vender",precioObjetivo:8000000,moneda:"MXN",plazo:"Tres meses"});
 const second=await start("vender",{tipo:"cliente",id:first.cliente_id});
 await complete(second.id,{...answers(),presupuestoEstado:"conocido",importe:"7000000",moneda:"MXN"});
 expect((await db.query<{data:{perfil:{precioObjetivo:number}}}>("select data from public.fortius_inmuebles_records where collection='clientes' and id=$1",[first.cliente_id])).rows[0].data.perfil.precioObjetivo).toBe(8000000);
});
it("allows a representative interview before marital information is known", async () => {
  const data = { ...answers(), relacion: "representante", estadoCivil: "casado" };
  expect((await complete((await start()).id, data)).estado).toBe("completada");
});
it("reuses an explicitly selected property for a second legitimate engagement", async () => {
  const first = await complete((await start()).id);
  const second = await start("vender", { tipo: "cliente", id: first.cliente_id });
  const done = await complete(second.id, { ...answers(), propiedadExistente: String(first.propiedad_slug) });
  expect(done.propiedad_slug).toBe(first.propiedad_slug);
  expect(done.expediente_id).not.toBe(first.expediente_id);
  expect(done.cliente_id).toBe(first.cliente_id);
});
it("does not merge distinct units merely because their approximate address matches", async () => {
  const first = await complete((await start()).id);
  const second = await complete((await start("vender", { tipo: "cliente", id: first.cliente_id })).id);
  expect(second.propiedad_slug).not.toBe(first.propiedad_slug);
});
it.each([ ["arrendar", "renta", "arrendador"], ["invertir", "inversion", "inversion"] ])("keeps %s in its own process without a fictitious purchase", async (intent, operation, route) => {
  const data = { ...answers(), uso: "Inversión o uso propio", necesidades: "Por definir", financiamiento: "por_definir", estrategia: "por_definir", horizonte: "Tres años" };
  const done = await complete((await start(intent)).id, data);
  const exp = (await db.query<{ operacion: string; flujo: { ruta: string } }>("select operacion,flujo from public.fortius_inmuebles_expedientes where id=$1", [done.expediente_id])).rows[0];
  expect(exp.operacion).toBe(operation);
  expect(exp.flujo?.ruta).toBe(route);
});
it("does not accept unlinked text or a nonexistent document as completed review evidence", async () => {
  await db.exec("reset role");
  try {
    for (const review of [{ estado: "revisado", soporte: "abc" }, { estado: "revisado", soporte: "Antecedente documental", evidencia: { tipo: "documento", referencia: "66000000-0000-4000-8000-000000000099", version: 1 } }]) {
      const result = await db.query<{ ready: boolean }>("select public.fortius_inmuebles_flow_review_ok($1::jsonb,'titularidad') ready", [JSON.stringify({ requisitos: { titularidad: review } })]);
      expect(result.rows[0].ready).toBe(false);
    }
  } finally { await db.exec("set role authenticated"); }
});
it("permits preparation despite a later registration observation while retaining its evidence", async () => {
  const done = await admit(await complete((await start()).id));
  const exp = (await db.query<{ version: number; flujo: { requisitos: Record<string, unknown> } }>("select version,flujo from public.fortius_inmuebles_expedientes where id=$1", [done.expediente_id])).rows[0];
  const reviewed = { estado: "revisado", soporte: "Revisión externa sintética registrada", evidencia: { tipo: "externa", referencia: "Archivo sintético de ensayo · versión 1", fecha: "2026-10-14", responsable: "Responsable de ensayo", resultado: "Apto dentro del alcance declarado", limites: "Ensayo sin efectos reales" } };
  for (const key of ["titularidad","factibilidad","valor","precio","intermediacion","levantamiento","plan","publicacion"]) exp.flujo.requisitos[key] = { ...reviewed, ...(key === "factibilidad" ? { vigenteHasta: "2030-12-31" } : {}) };
  exp.flujo.requisitos.registro = { estado: "observado", soporte: "Pendiente para el trámite registral posterior" };
  const flow = { ...exp.flujo, resolucion: { tipo: "aceptada", fecha: "2026-10-14", motivo: "Evaluación y alcance de prueba aceptados", siguienteAccion: "Preparar comercialización", fechaSiguiente: "2030-12-31" } };
  const result = await db.query<{ r: { etapa: string; flujo: { requisitos: { registro: { estado: string } } } } }>("select public.fortius_inmuebles_update_operation($1,$2,'comercializacion',null,'{}'::jsonb,$3::jsonb,null,false) r", [done.expediente_id, exp.version, JSON.stringify(flow)]);
  expect(result.rows[0].r.etapa).toBe("comercializacion");
  expect(result.rows[0].r.flujo.requisitos.registro.estado).toBe("observado");
});
it.each(["arrendar","invertir"])("walks %s through its evidenced process and archives only after resolving tasks", async intent => {
 const intakeAnswers={...answers(),uso:"Uso o inversión",necesidades:"Criterios de ensayo",financiamiento:"por_definir",estrategia:"por_definir",horizonte:"Tres años"};
 const done=await complete((await start(intent)).id,intakeAnswers);
 // Avanzar de etapa y cambiar el inmueble van en movimientos separados.
 await admit(done);
 const row=(await db.query<{version:number;flujo:{requisitos:Record<string,unknown>;[key:string]:unknown}}>("select version,flujo from public.fortius_inmuebles_expedientes where id=$1",[done.expediente_id])).rows[0];
 const evidence={tipo:"externa",referencia:"Documento externo sintético revisado v1",fecha:"2026-10-14",responsable:"Responsable del ensayo",resultado:"Actividad revisada dentro del alcance de prueba"};
 const keys=intent==="invertir"?["criterios_inversion","riesgos_inversion","escenarios_inversion","decision_inversion","capacidad","ejecucion_inversion","seguimiento_inversion","honorarios","archivo"]:["titularidad","factibilidad","valor","precio","intermediacion","levantamiento","plan","publicacion","arrendatario","opciones","visitas","capacidad","oferta","revision_cierre","contrato_renta","contraparte","garantias_renta","firma","pago","entrega","inventario_entrega","termino_renta","honorarios","archivo"];
 for(const key of keys)row.flujo.requisitos[key]={estado:"revisado",soporte:"Revisión externa de ensayo",evidencia:evidence,...(["factibilidad","revision_cierre"].includes(key)?{vigenteHasta:"2030-12-31"}:{})};
 const flow={...row.flujo,contraparteExterna:intent==="invertir"?undefined:"Contraparte externa de ensayo",resolucion:{tipo:"aceptada",fecha:"2026-10-14",motivo:"Encargo de ensayo aceptado",siguienteAccion:"Seguimiento del encargo",fechaSiguiente:"2030-12-31"}};
 let version=row.version;
 if(intent!=="invertir") {
  const saved=await db.query<{r:{version:number}}>("select public.fortius_inmuebles_update_operation($1,$2,'documentacion',null,'{}'::jsonb,$3::jsonb,null,false) r",[done.expediente_id,version,JSON.stringify(flow)]);
  version=saved.rows[0].r.version;
 }
 for(const stage of ["comercializacion","negociacion","cierre","entrega","postventa"]) {
  const result=await db.query<{r:{version:number;etapa:string}}>("select public.fortius_inmuebles_update_operation($1,$2,$3,null,'{}'::jsonb,$4::jsonb,null,false) r",[done.expediente_id,version,stage,JSON.stringify(flow)]);
  expect(result.rows[0].r.etapa).toBe(stage);version=result.rows[0].r.version;
 }
 await expect(db.query("select public.fortius_inmuebles_update_operation($1,$2,'cerrado',null,'{}'::jsonb,null,null,false)",[done.expediente_id,version])).rejects.toMatchObject({code:"PT409"});
 const tasks=(await db.query<{id:string;data:Record<string,unknown>;version:number}>("select id,data,version from public.fortius_inmuebles_records where collection='tareas' and data->>'expedienteId'=$1",[done.expediente_id])).rows;
 for(const task of tasks)await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,$3)",[task.id,JSON.stringify({...task.data,estado:"completada"}),task.version]);
 const final=await db.query<{r:{etapa:string}}>("select public.fortius_inmuebles_update_operation($1,$2,'cerrado',null,'{}'::jsonb,null,null,false) r",[done.expediente_id,version]);
 expect(final.rows[0].r.etapa).toBe("cerrado");
});
it("keeps historical buyer and tenant operations working, but opens no new ones (COR-11)",async()=>{
 const done=await admit(await complete((await start("arrendar")).id));
 // Simula una operación de búsqueda de renta creada antes de la regla (RP-93).
 await db.exec("reset role; set session_replication_role=replica;");
 await db.query("update public.fortius_inmuebles_expedientes set flujo=jsonb_set(flujo,'{ruta}','\"arrendatario\"') where id=$1",[done.expediente_id]);
 await db.exec("set session_replication_role=origin; set role authenticated;");
 const row=(await db.query<{version:number;flujo:Record<string,unknown>}>("select version,flujo from public.fortius_inmuebles_expedientes where id=$1",[done.expediente_id])).rows[0];
 const saved=await db.query<{r:{flujo:{ruta:string;motivo:string}}}>("select public.fortius_inmuebles_update_operation($1,$2,'documentacion',null,'{}'::jsonb,$3::jsonb,null,false) r",[done.expediente_id,row.version,JSON.stringify({...row.flujo,motivo:"Nota histórica"})]);
 expect(saved.rows[0].r.flujo.ruta).toBe("arrendatario");
 // No se cambia una operación del propietario a una ruta de búsqueda.
 const owner=await admit(await complete((await start("vender")).id));
 const own=(await db.query<{version:number;flujo:Record<string,unknown>}>("select version,flujo from public.fortius_inmuebles_expedientes where id=$1",[owner.expediente_id])).rows[0];
 await expect(db.query("select public.fortius_inmuebles_update_operation($1,$2,'documentacion',null,'{}'::jsonb,$3::jsonb,null,false)",[owner.expediente_id,own.version,JSON.stringify({...own.flujo,ruta:"compra"})])).rejects.toMatchObject({code:"PT400"});
});
it("registers an interested lead as the counterparty of the owner's operation (COR-11)",async()=>{
 await db.query("select public.fortius_inmuebles_put_record('leads','interesado-ensayo',$1::jsonb,null)",[JSON.stringify({id:"interesado-ensayo",nombre:"Interesado de ejemplo",telefono:"6640001122",origen:"manual",estado:"contactado",creadoEl:"2026-10-29T10:00:00.000Z",notas:[],perfil:{operacion:"comprar"}})]);
 const owner=await admit(await complete((await start("vender")).id));
 const read=async()=>(await db.query<{version:number;flujo:Record<string,unknown>}>("select version,flujo from public.fortius_inmuebles_expedientes where id=$1",[owner.expediente_id])).rows[0];
 const update=async(flow:Record<string,unknown>)=>{const row=await read();return db.query<{r:{flujo:Record<string,unknown>}}>("select public.fortius_inmuebles_update_operation($1,$2,'documentacion',null,'{}'::jsonb,$3::jsonb,null,false) r",[owner.expediente_id,row.version,JSON.stringify({...row.flujo,...flow})]);};
 await expect(update({contraparteLeadId:"no-existe"})).rejects.toMatchObject({code:"PT400"});
 const saved=await update({contraparteLeadId:"interesado-ensayo"});
 expect(saved.rows[0].r.flujo.contraparteLeadId).toBe("interesado-ensayo");
});
it("schedules the next action of a paused decision without cancelling existing obligations",async()=>{
 const done=await admit(await complete((await start()).id));
 const row=(await db.query<{version:number;flujo:Record<string,unknown>}>("select version,flujo from public.fortius_inmuebles_expedientes where id=$1",[done.expediente_id])).rows[0];
 const flow={...row.flujo,resolucion:{tipo:"pausada",fecha:"2026-10-14",motivo:"Esperar documentación del titular",siguienteAccion:"Revisar condiciones de la pausa",fechaSiguiente:"2030-10-31"}};
 await db.query("select public.fortius_inmuebles_update_operation($1,$2,'documentacion',null,'{}'::jsonb,$3::jsonb,null,false)",[done.expediente_id,row.version,JSON.stringify(flow)]);
 const tasks=(await db.query<{data:{titulo:string;estado:string;vence:string}}>("select data from public.fortius_inmuebles_records where collection='tareas' and data->>'expedienteId'=$1",[done.expediente_id])).rows.map(r=>r.data);
 expect(tasks).toContainEqual(expect.objectContaining({titulo:"Revisar condiciones de la pausa",estado:"pendiente",vence:"2030-10-31"}));
 expect(tasks).toContainEqual(expect.objectContaining({titulo:"Revisar antecedentes",estado:"pendiente"}));
});
it("keeps an investor role when converting a manual prospect before completing the interview",async()=>{
 const first=await start("invertir");
 const lead=(await db.query<{version:number}>("select version from public.fortius_inmuebles_records where collection='leads' and id=$1",[first.lead_id])).rows[0];
 const converted=(await db.query<{r:{cliente:{data:{tipo:string}}}}>("select public.fortius_inmuebles_convert_lead($1,$2) r",[first.lead_id,lead.version])).rows[0].r;
 expect(converted.cliente.data.tipo).toBe("inversionista");
});
it("allows gradual historical evidence regularization without authorizing unproved advancement",async()=>{
 const done=await complete((await start()).id);
 await db.exec("reset role");
 try {
  await db.exec("alter table public.fortius_inmuebles_expedientes disable trigger all");
  await db.query("update public.fortius_inmuebles_expedientes set flujo=jsonb_set(flujo,'{requisitos,titularidad}',$2::jsonb) where id=$1",[done.expediente_id,JSON.stringify({estado:"revisado",soporte:"Antecedente de revisión histórica sin referencia estructurada"})]);
 } finally { await db.exec("alter table public.fortius_inmuebles_expedientes enable trigger all; set role authenticated"); }
 const current=(await db.query<{version:number}>("select version from public.fortius_inmuebles_expedientes where id=$1",[done.expediente_id])).rows[0];
 const saved=(await db.query<{r:{version:number;flujo:{requisitos:{titularidad:{soporte:string}}}}}>("select public.fortius_inmuebles_update_operation($1,$2,'documentacion','2030-12-30','{}'::jsonb,null,null,false) r",[done.expediente_id,current.version])).rows[0].r;
 expect(saved.flujo.requisitos.titularidad.soporte).toBe("Antecedente de revisión histórica sin referencia estructurada");
 await expect(db.query("select public.fortius_inmuebles_update_operation($1,$2,'comercializacion',null,'{}'::jsonb,null,null,false)",[done.expediente_id,saved.version])).rejects.toMatchObject({code:"PT409"});
});
