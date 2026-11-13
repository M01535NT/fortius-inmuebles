import { afterAll, beforeAll, expect, it } from "vitest";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";

// SEG-M3 (auditoría del 13/11/2026): la dirección exacta que declara el propietario se queda en la
// operación; el inmueble captado se titula con la zona y no se publica con la dirección exacta.
let db: PGlite;
const own = "57000000-0000-4000-8000-000000000002";
const exact = "Calle Ficticia 123, Colonia de Ensayo";
async function asUser<T>(id: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  try { return await action(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${own}');
    insert into public.fortius_inmuebles_staff(user_id,role) values ('${own}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own');`);
});
afterAll(async () => { await db?.close(); });

const answers = {
  fecha: "2026-11-13", objetivo: "Vender", plazo: "Tres meses", zona: "Tijuana", tipoInmueble: "casa", presupuestoEstado: "por_definir",
  privacidad: "presentado", siguienteAccion: "Revisar documentos", siguienteFecha: "2030-10-20",
  relacion: "propietario", ocupacion: "por_aclarar", documentos: "Por aclarar", alertas: "por_aclarar", estadoCivil: "soltero", ubicacion: exact,
};

it("el inmueble captado usa la zona y la dirección exacta queda en la operación", async () => {
  const slug = await asUser(own, async () => {
    const started = (await db.query<{ r: { id: string } }>("select public.fortius_inmuebles_start_intake($1,'vender',$2::jsonb,null) r", [crypto.randomUUID(),
      JSON.stringify({ tipo: "nuevo", nombre: "Propietario sintético", telefono: "6641230000", email: "", asesorId: "own", telefonoCompartido: true,
        seguimiento: { origen: "llamada", accion: "Revisar documentos", fecha: "2030-10-20" } })])).rows[0].r;
    const done = (await db.query<{ r: { propiedad_slug: string } }>("select public.fortius_inmuebles_save_intake($1,1,$2::jsonb,true) r", [started.id, JSON.stringify(answers)])).rows[0].r;
    return done.propiedad_slug;
  });
  const property = (await db.query<{ data: Record<string, unknown> }>("select data from public.fortius_inmuebles_records where collection='propiedades' and id=$1", [slug])).rows[0].data;
  expect(property).toMatchObject({ titulo: "Casa · Tijuana", direccionAproximada: "Tijuana", publicada: false });
  expect(JSON.stringify(property)).not.toContain("Calle Ficticia");
  expect((await db.query<{ unidad: string }>("select unidad from public.fortius_inmuebles_expedientes where propiedad_slug=$1", [slug])).rows[0].unidad).toBe(exact);

  // Se aísla esta regla de la puerta guiada de publicación, que tiene sus propias pruebas.
  await db.exec("alter table public.fortius_inmuebles_records disable trigger fortius_01_guard_guided_publication");
  try {
    const publish = (extra: Record<string, unknown>) => db.query("update public.fortius_inmuebles_records set data=data||$2::jsonb where collection='propiedades' and id=$1", [slug, JSON.stringify({ publicada: true, estado: "disponible", publicadaEl: "2026-11-13", ...extra })]);
    await expect(publish({ titulo: `Casa en ${exact.toUpperCase()}` })).rejects.toMatchObject({ code: "PT409", message: expect.stringContaining("dirección exacta") });
    await expect(publish({ direccionAproximada: exact })).rejects.toMatchObject({ code: "PT409" });
    await publish({});
    // Guardar sin publicar no se bloquea: el asesor puede seguir corrigiendo.
    await db.query("update public.fortius_inmuebles_records set data=data||$2::jsonb where collection='propiedades' and id=$1", [slug, JSON.stringify({ publicada: false, titulo: exact })]);
  } finally {
    await db.exec("alter table public.fortius_inmuebles_records enable trigger fortius_01_guard_guided_publication");
  }
});
