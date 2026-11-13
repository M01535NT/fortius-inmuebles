import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

/*
  COR-23 y DEC-43 (12/11/2026): lo que solo cambia el director, comprobado en la base, que es por
  donde pasa cualquier escritura (panel, API o llamada directa al RPC).
*/
let db: PGlite;
const admin = "53000000-0000-4000-8000-000000000001";
const own = "53000000-0000-4000-8000-000000000002";
const other = "53000000-0000-4000-8000-000000000003";
const operation = "53000000-0000-4000-8000-000000000010";
async function asUser<T>(uid: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  try { return await action(); } finally { await db.exec("reset role"); }
}
const put = (collection: string, id: string, data: unknown, version: number | null = null) =>
  db.query<{ r: { version: number } }>("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,$4) as r", [collection, id, JSON.stringify(data), version]).then(x => x.rows[0].r);
const remove = (collection: string, id: string, version: number) => db.query("select public.fortius_inmuebles_delete_record($1,$2,$3)", [collection, id, version]);
// Un local en renta: la puerta de publicación de la venta guiada no aplica y se prueba solo esta regla.
const listing = (slug: string, extra: Record<string, unknown> = {}) => ({ slug, codigo: slug.toUpperCase(), titulo: "Local ficticio de ensayo", tipo: "local", operacion: "renta", precio: { modalidad: "consulta" }, zona: "Prueba", direccionAproximada: "Prueba", descripcion: ["Prueba"], ficha: {}, amenidades: [], galeria: [{ src: "/hero/casa-playa.webp", alt: "Prueba" }], asesorId: "own", creditoDisponible: false, puntosDeInteres: [], destacada: false, estado: "disponible", publicadaEl: "2026-11-12", demo: true, publicada: false, ...extra });
const settings = { nombreComercial: "Fortius", telefono: "", whatsapp: "", email: "", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "" };

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
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');`);
  await asUser(admin, async () => {
    await put("asesores", "own", { id: "own", nombre: "Ana", cargo: "Asesora", iniciales: "AA", activo: true });
    await put("asesores", "other", { id: "other", nombre: "Luis", cargo: "Asesor", iniciales: "LL", activo: true });
    await put("config", "singleton", settings);
  });
  await db.exec(`insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.fortius_inmuebles_records(collection,id,data) values ('clientes','c-own','{"id":"c-own","nombre":"Propietario ficticio","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-11-12","actualizadoEl":"2026-11-12"}');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values ('${operation}','c-own','own','EXP-ALCANCE');`);
});
afterAll(async () => { await db?.close(); });

it("solo el director cambia Configuración, Sitio web, Blog y Equipo", async () => {
  await asUser(own, async () => {
    await expect(put("config", "singleton", { ...settings, telefono: "6640000000" }, 1)).rejects.toMatchObject({ code: "PT403" });
    await expect(put("contenido", "singleton", { heroTitulo: "x", heroSubtitulo: "x", manifiestoTitulo: "x", manifiestoTexto: "x", seoTitle: "x", seoDescription: "x" })).rejects.toMatchObject({ code: "PT403" });
    await expect(put("posts", "p1", { id: "p1", slug: "nota", titulo: "Nota", resumen: "R", contenido: "C", estado: "borrador", actualizadoEl: "2026-11-12" })).rejects.toMatchObject({ code: "PT403" });
    await expect(put("asesores", "own", { id: "own", nombre: "Ana María", cargo: "Asesora", iniciales: "AM", activo: true }, 1)).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(admin, async () => { expect((await put("config", "singleton", { ...settings, telefono: "6640000000" }, 1)).version).toBe(2); });
});

it("el asesor da de alta y edita solo sus inmuebles, y no los reasigna", async () => {
  await asUser(own, async () => {
    await expect(put("propiedades", "ajeno-alta", listing("ajeno-alta", { asesorId: "other" }))).rejects.toMatchObject({ code: "PT403" });
    expect((await put("propiedades", "propio", listing("propio"))).version).toBe(1);
    expect((await put("propiedades", "propio", listing("propio", { titulo: "Local ficticio corregido" }), 1)).version).toBe(2);
    await expect(put("propiedades", "propio", listing("propio", { asesorId: "other" }), 2)).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(other, async () => {
    await expect(put("propiedades", "propio", listing("propio", { titulo: "Cambio ajeno" }), 2)).rejects.toMatchObject({ code: "PT403" });
    await expect(remove("propiedades", "propio", 2)).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(admin, async () => { expect((await put("propiedades", "propio", listing("propio", { asesorId: "other" }), 2)).version).toBe(3); });
});

it("publicar y destacar lo hace el director; retirar la publicación, también el asesor del inmueble", async () => {
  // La puerta de la captación (otra regla, con sus propias pruebas) se apaga solo aquí, para
  // probar el caso que agrega esta: el asesor con la captación lista tampoco publica.
  await db.exec("alter table public.fortius_inmuebles_records disable trigger fortius_01_guard_guided_publication");
  try { await publishing(); } finally { await db.exec("alter table public.fortius_inmuebles_records enable trigger fortius_01_guard_guided_publication"); }
});
async function publishing() {
  await asUser(own, async () => {
    await put("propiedades", "para-publicar", listing("para-publicar"));
    await expect(put("propiedades", "para-publicar", listing("para-publicar", { publicada: true }), 1)).rejects.toMatchObject({ code: "PT403" });
    await expect(put("propiedades", "para-publicar", listing("para-publicar", { destacada: true }), 1)).rejects.toMatchObject({ code: "PT403" });
    await expect(put("propiedades", "alta-publicada", listing("alta-publicada", { publicada: true }))).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(admin, async () => { expect((await put("propiedades", "para-publicar", listing("para-publicar", { publicada: true }), 1)).version).toBe(2); });
  await asUser(own, async () => {
    // Ya publicado: el asesor puede corregirlo y retirarlo, no volver a publicarlo.
    expect((await put("propiedades", "para-publicar", listing("para-publicar", { publicada: true, titulo: "Local con título nuevo" }), 2)).version).toBe(3);
    expect((await put("propiedades", "para-publicar", listing("para-publicar", { publicada: false }), 3)).version).toBe(4);
    await expect(put("propiedades", "para-publicar", listing("para-publicar", { publicada: true }), 4)).rejects.toMatchObject({ code: "PT403" });
  });
}

// Revisión con su respaldo, como la deja «Confirmar» en la operación.
const reviewed = (soporte: string) => ({ estado: "revisado", soporte, evidencia: { tipo: "externa", referencia: "Documento sintético de ensayo · versión 1", fecha: "2026-11-12", responsable: "Revisor de ensayo", resultado: "Dentro del alcance de prueba" } });
const flow = (requisitos: Record<string, unknown>, resolucion?: Record<string, unknown>) => ({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos, ...(resolucion ? { resolucion } : {}) });
async function saveFlow(value: Record<string, unknown>) {
  const version = (await db.query<{ version: number }>("select version from public.fortius_inmuebles_expedientes where id=$1", [operation])).rows[0].version;
  return db.query("select public.fortius_inmuebles_update_operation($1,$2,'captacion',null,'{}'::jsonb,$3::jsonb,null,false)", [operation, version, JSON.stringify(value)]);
}
const decision = (tipo: string) => ({ tipo, fecha: "2026-11-12", motivo: "Decisión de ensayo documentada", siguienteAccion: "Seguimiento de ensayo", fechaSiguiente: "2030-12-31" });

it("el asesor deja listo lo jurídico, el precio, los contratos y la publicación; el director los marca revisados", async () => {
  await asUser(own, async () => {
    // Lo operativo sí lo revisa el asesor.
    await saveFlow(flow({ entrevista: reviewed("Entrevista de ensayo revisada") }));
    for (const key of ["titularidad", "precio", "intermediacion", "publicacion"]) {
      await expect(saveFlow(flow({ [key]: reviewed("Revisión de ensayo del asesor") }))).rejects.toMatchObject({ code: "PT403" });
    }
    await saveFlow(flow({ precio: { estado: "recibido", soporte: "Precio acordado de ensayo" } }));
  });
  await asUser(admin, async () => { await saveFlow(flow({ precio: reviewed("Precio revisado por el director") })); });
  await asUser(own, async () => {
    // Otro cambio deja intacta la revisión del director; bajarla a «observado» también se permite.
    await saveFlow(flow({ levantamiento: { estado: "recibido", soporte: "Levantamiento de ensayo" } }));
    await saveFlow(flow({ precio: { estado: "observado", soporte: "El propietario pidió revisar el precio" } }));
  });
});

it("tomar el encargo lo decide el director; pausarlo, también el asesor", async () => {
  await asUser(own, async () => {
    await expect(saveFlow(flow({}, decision("aceptada")))).rejects.toMatchObject({ code: "PT403" });
    await expect(saveFlow(flow({}, { ...decision("condicionada"), condiciones: "Falta la constancia de no adeudo de ensayo", permitidas: ["documentacion"] }))).rejects.toMatchObject({ code: "PT403" });
    await saveFlow(flow({}, decision("pausada")));
  });
  await asUser(admin, async () => { await saveFlow(flow({}, decision("aceptada"))); });
});

// COR-20 y RP-31: el director autoriza avanzar sin un requisito, con motivo y constancia.
const reviewOk = (key: string) => db.query<{ ok: boolean }>("select public.fortius_inmuebles_flow_review_ok(flujo,$2) as ok from public.fortius_inmuebles_expedientes where id=$1", [operation, key]).then(r => r.rows[0].ok);
const exceptionOf = (key: string) => db.query<{ e: Record<string, string> | null }>("select flujo->'requisitos'->$2->'excepcion' as e from public.fortius_inmuebles_expedientes where id=$1", [operation, key]).then(r => r.rows[0].e);
const motivo = "El propietario entrega el plan firmado la próxima semana";

it("solo el director autoriza una excepción, con motivo y nunca en un requisito de protección", async () => {
  expect(await reviewOk("plan")).toBe(false);
  await asUser(own, async () => {
    await expect(saveFlow(flow({ plan: { estado: "recibido", soporte: "", excepcion: { motivo } } }))).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(admin, async () => {
    await expect(saveFlow(flow({ plan: { estado: "pendiente", soporte: "", excepcion: { motivo: "Corto" } } }))).rejects.toMatchObject({ code: "PT400" });
    for (const key of ["titularidad", "factibilidad", "valor", "revision_cierre", "firma", "pago"]) {
      await expect(saveFlow(flow({ [key]: { estado: "pendiente", soporte: "", excepcion: { motivo } } }))).rejects.toMatchObject({ code: "PT400" });
    }
    // Lo que se envíe como autor no cuenta: el servidor anota quién y cuándo.
    await saveFlow(flow({ plan: { estado: "pendiente", soporte: "", excepcion: { motivo, autorizadoPor: own } } }));
  });
  const stamped = await exceptionOf("plan");
  expect(stamped).toMatchObject({ motivo, autorizadoPor: admin });
  expect(stamped?.autorizadoEl).toBeTruthy();
  expect(await reviewOk("plan")).toBe(true);
  await asUser(own, async () => {
    // El asesor conserva la excepción al cambiar otra cosa del requisito, no la reescribe, y puede quitarla.
    await saveFlow(flow({ plan: { estado: "recibido", soporte: "Borrador del plan de ensayo", excepcion: stamped } }));
    expect(await exceptionOf("plan")).toEqual(stamped);
    await expect(saveFlow(flow({ plan: { estado: "recibido", soporte: "Borrador del plan de ensayo", excepcion: { ...stamped, motivo: `${motivo} y otra cosa` } } }))).rejects.toMatchObject({ code: "PT403" });
    await saveFlow(flow({ plan: { estado: "recibido", soporte: "Borrador del plan de ensayo" } }));
  });
  expect(await exceptionOf("plan")).toBeNull();
  expect(await reviewOk("plan")).toBe(false);
});
