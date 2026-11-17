import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { parseRecord } from "@/lib/backend/validation";

let db: PGlite;
const admin = "62000000-0000-4000-8000-000000000001";
const own = "62000000-0000-4000-8000-000000000002";
const other = "62000000-0000-4000-8000-000000000003";
const outsider = "62000000-0000-4000-8000-000000000004";
async function asUser<T>(user: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  try { return await action(); } finally { await db.exec("reset role"); }
}
const lead = (id: string, extra = {}) => ({ id, nombre: "Persona de prueba", telefono: "+52 664 123 4567", email: "prueba@example.invalid", origen: "manual", estado: "contactado", asesorId: "own", creadoEl: "2026-10-04T10:00:00Z", notas: [{ id: "n1", texto: "Seguimiento conservado", fecha: "2026-10-04" }], zona: "Otay", mensaje: "Consulta inicial", tipoPropiedad: "casa", perfil: { operacion: "comprar", presupuestoMax: 250000, moneda: "USD", formaPago: "credito", requisitos: "Acceso sin escalones", futureField: "conservar" }, datoFuturo: { detalle: "Conservar íntegro" }, ...extra });
async function create(id: string, extra = {}) {
  const data = lead(id, extra);
  await asUser(admin, () => db.query("select public.fortius_inmuebles_put_record('leads',$1,$2::jsonb,null)", [id, JSON.stringify(data)]));
  return data;
}
async function convert(id: string, version = 1) {
  return (await db.query<{ result: { cliente: { id: string; data: Record<string, unknown>; version: number }; lead: { data: Record<string, unknown>; version: number } } }>("select public.fortius_inmuebles_convert_lead($1,$2) as result", [id, version])).rows[0].result;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${admin}'),('${own}'),('${other}'),('${outsider}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');`);
});
afterAll(async () => { await db?.close(); });

it("convierte atómicamente con todo el perfil, historial, contacto, asesor y campos futuros", async () => {
  const original = await create("rich");
  const result = await asUser(own, () => convert("rich"));
  expect(result.cliente.data).toMatchObject({ nombre: original.nombre, telefono: original.telefono, email: original.email, asesorId: "own", tipo: "comprador", perfil: original.perfil, zona: original.zona, tipoPropiedad: original.tipoPropiedad, mensaje: original.mensaje, datoFuturo: original.datoFuturo, leadId: "rich", leadOriginal: { id: original.id, creadoEl: original.creadoEl, notas: original.notas }, notas: "" });
  expect((await db.query("select source_data from public.fortius_inmuebles_lead_conversions where lead_id='rich'")).rows).toEqual([{ source_data: original }]);
  expect(result.lead.data).toMatchObject({ ...original, clienteId: result.cliente.id });
  expect(result.lead.version).toBe(2);
  expect(result.cliente.version).toBe(1);
  await asUser(own, async () => {
    expect((await db.query("select id from public.fortius_inmuebles_records where collection='clientes' and id=$1", [result.cliente.id])).rows).toHaveLength(1);
    await expect(db.query("select * from public.fortius_inmuebles_lead_conversions")).rejects.toMatchObject({ code: "42501" });
  });
});

it("reintentar la misma conversión devuelve el mismo cliente sin sobrescribir sus cambios", async () => {
  await create("retry");
  await asUser(own, async () => {
    const first = await convert("retry");
    await db.query("select public.fortius_inmuebles_put_record('clientes',$1,$2::jsonb,1)", [first.cliente.id, JSON.stringify({ ...first.cliente.data, telefono: "6647654321", notas: "Nota nueva del cliente" })]);
    const second = await convert("retry", 1);
    expect(second.cliente.id).toBe(first.cliente.id);
    expect(second.cliente.version).toBe(2);
    expect(second.cliente.data.telefono).toBe("6647654321");
    expect(second.cliente.data.notas).toBe("Nota nueva del cliente");
    expect(second.lead.version).toBe(2);
  });
  expect((await db.query("select * from public.fortius_inmuebles_lead_conversions where lead_id='retry'")).rows).toHaveLength(1);
});

it("rechaza una versión obsoleta sin crear un cliente ni modificar el lead", async () => {
  const data = await create("stale");
  await asUser(own, async () => {
    await db.query("select public.fortius_inmuebles_put_record('leads','stale',$1::jsonb,1)", [JSON.stringify({ ...data, nombre: "Nombre actualizado" })]);
    await expect(convert("stale", 1)).rejects.toMatchObject({ code: "PT409" });
    expect((await db.query("select data,version from public.fortius_inmuebles_records where collection='leads' and id='stale'")).rows).toMatchObject([{ data: { nombre: "Nombre actualizado" }, version: 2 }]);
  });
  expect((await db.query("select * from public.fortius_inmuebles_lead_conversions where lead_id='stale'")).rows).toEqual([]);
});

it("impide convertir leads ajenos o sin membresía y tampoco filtra un cliente ya convertido", async () => {
  await create("private");
  await asUser(other, async () => { await expect(convert("private")).rejects.toMatchObject({ code: "PT403" }); });
  await asUser(outsider, async () => { await expect(convert("private")).rejects.toMatchObject({ code: "PT403" }); });
  await asUser(own, () => convert("private"));
  await asUser(other, async () => { await expect(convert("private")).rejects.toMatchObject({ code: "PT403" }); });
});

it.each([["comprar", "comprador"], ["vender", "propietario"], ["rentar", "arrendatario"], ["arrendar", "arrendador"], [undefined, "otro"]])("deduce el tipo %s sin pedir otra captura", async (operacion, tipo) => {
  const id = `type-${tipo}`;
  await create(id, { perfil: operacion ? { operacion } : undefined });
  expect((await asUser(admin, () => convert(id))).cliente.data.tipo).toBe(tipo);
});

it("no permite falsificar ni borrar vínculos y conserva el historial aunque se intente eliminar", async () => {
  const data = await create("protected");
  await asUser(own, async () => {
    await expect(db.query("select public.fortius_inmuebles_put_record('leads','protected',$1::jsonb,1)", [JSON.stringify({ ...data, clienteId: "fake", convertidoEl: "2026-10-04" })])).rejects.toMatchObject({ code: "PT403" });
    const result = await convert("protected");
    const withoutLink = { ...result.lead.data };
    delete withoutLink.clienteId;
    await expect(db.query("select public.fortius_inmuebles_put_record('leads','protected',$1::jsonb,2)", [JSON.stringify(withoutLink)])).rejects.toMatchObject({ code: "PT403" });
    await expect(db.query("select public.fortius_inmuebles_put_record('clientes',$1,$2::jsonb,1)", [result.cliente.id, JSON.stringify({ ...result.cliente.data, leadOriginal: {} })])).rejects.toMatchObject({ code: "PT403" });
    await expect(db.query("select public.fortius_inmuebles_delete_record('leads','protected',2)")).rejects.toMatchObject({ code: "PT409" });
    await expect(db.query("select public.fortius_inmuebles_delete_record('clientes',$1,1)", [result.cliente.id])).rejects.toMatchObject({ code: "PT409" });
  });
});

it("si se rechaza el guardado final, revierte el cliente, el vínculo y ambas escrituras", async () => {
  await create("rollback");
  await db.exec(`create function public.qa_reject_conversion() returns trigger language plpgsql as $$begin if new.collection='leads' and new.id='rollback' and new.data ? 'clienteId' then raise sqlstate 'PT400' using message='Fallo final de prueba'; end if; return new; end;$$;
    create trigger qa_reject_conversion before update on public.fortius_inmuebles_records for each row execute function public.qa_reject_conversion();`);
  const before = (await db.query("select count(*) from public.fortius_inmuebles_records where collection='clientes'")).rows;
  await asUser(own, async () => { await expect(convert("rollback")).rejects.toMatchObject({ code: "PT400" }); });
  expect((await db.query("select count(*) from public.fortius_inmuebles_records where collection='clientes'")).rows).toEqual(before);
  expect((await db.query("select * from public.fortius_inmuebles_lead_conversions where lead_id='rollback'")).rows).toEqual([]);
  expect((await db.query("select version,data->>'clienteId' as client from public.fortius_inmuebles_records where collection='leads' and id='rollback'")).rows).toEqual([{ version: 1, client: null }]);
  await db.exec("drop trigger qa_reject_conversion on public.fortius_inmuebles_records; drop function public.qa_reject_conversion()");
});

it("convierte y permite editar un lead válido cerca del límite con diez notas completas", async () => {
  const data = lead("large", { mensaje: "m".repeat(20000), perfil: { operacion: "comprar", requisitos: "r".repeat(20000) }, notas: Array.from({ length: 10 }, (_, i) => ({ id: `note-${i}`, texto: "n".repeat(20000), fecha: "2026-10-04" })), padding: "" });
  const padded = { ...data, padding: "x".repeat(249900 - new TextEncoder().encode(JSON.stringify(data)).byteLength) };
  expect(() => parseRecord("leads", "large", padded)).not.toThrow();
  await create("large", padded);
  const result = await asUser(own, () => convert("large"));
  expect(result.cliente.data.padding).toBe(padded.padding);
  expect(result.cliente.data.leadOriginal).toMatchObject({ notas: padded.notas });
  const edited = parseRecord("clientes", result.cliente.id, { ...result.cliente.data, notas: "Cliente editable después de convertir" });
  await asUser(own, () => db.query("select public.fortius_inmuebles_put_record('clientes',$1,$2::jsonb,1)", [result.cliente.id, JSON.stringify(edited)]));
});

it("reasigna cliente y lead juntos para que el nuevo asesor pueda ver historial y agenda", async () => {
  const original = await create("reassigned");
  const result = await asUser(admin, () => convert("reassigned"));
  await asUser(admin, () => db.query("select public.fortius_inmuebles_put_record('clientes',$1,$2::jsonb,1)", [result.cliente.id, JSON.stringify({ ...result.cliente.data, asesorId: "other" })]));
  await asUser(other, async () => {
    expect((await db.query("select data,version from public.fortius_inmuebles_records where collection='leads' and id='reassigned'")).rows).toMatchObject([{ data: { asesorId: "other", clienteId: result.cliente.id }, version: 3 }]);
  });
  await asUser(own, async () => { expect((await db.query("select id from public.fortius_inmuebles_records where collection='leads' and id='reassigned'")).rows).toEqual([]); });
  await asUser(admin, async () => {
    await expect(db.query("select public.fortius_inmuebles_put_record('leads','reassigned',$1::jsonb,3)", [JSON.stringify({ ...original, clienteId: result.cliente.id, convertidoEl: result.lead.data.convertidoEl, convertidoPor: result.lead.data.convertidoPor })])).rejects.toMatchObject({ code: "PT403" });
    await db.query("select public.fortius_inmuebles_put_record('clientes',$1,$2::jsonb,2)", [result.cliente.id, JSON.stringify({ ...result.cliente.data, asesorId: "" })]);
    expect((await db.query("select data->>'asesorId' as adviser,version from public.fortius_inmuebles_records where collection='leads' and id='reassigned'")).rows).toEqual([{ adviser: null, version: 4 }]);
  });
});

it("reserva margen SQL para metadatos aun cuando los campos futuros usan el límite existente", async () => {
  const data = { ...lead("dense", { perfil: { futureField: Object.fromEntries(Array.from({ length: 7000 }, (_, i) => [`k${i}`, "x"])) } }), padding: "" };
  const size = (await db.query<{ size: number }>("select octet_length($1::jsonb::text) as size", [JSON.stringify(data)])).rows[0].size;
  const padded = { ...data, padding: "x".repeat(262050 - size) };
  expect(() => parseRecord("leads", "dense", padded)).not.toThrow();
  await create("dense", padded);
  const result = await asUser(own, () => convert("dense"));
  const edited = parseRecord("clientes", result.cliente.id, { ...result.cliente.data, notas: "Sigue editable" });
  await asUser(own, () => db.query("select public.fortius_inmuebles_put_record('clientes',$1,$2::jsonb,1)", [result.cliente.id, JSON.stringify(edited)]));
  expect(result.cliente.data.perfil).toEqual(padded.perfil);
});

it("no autoriza llamadas anónimas al convertidor", async () => {
  await db.exec("set role anon");
  try { await expect(convert("rich")).rejects.toMatchObject({ code: "42501" }); }
  finally { await db.exec("reset role"); }
});
