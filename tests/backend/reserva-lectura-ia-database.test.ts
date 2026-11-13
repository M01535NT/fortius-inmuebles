import { afterAll, beforeAll, expect, it } from "vitest";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";

// B9 / C-19: la reserva de una lectura con IA cuenta para el tope antes de llamar al servicio.
let db: PGlite;
const own = "52000000-0000-4000-8000-000000000002";
const expediente = "52000000-0000-4000-8000-000000000010";
const archivo = "52000000-0000-4000-8000-000000000021";
const reservar = (tope: number, reserva = 0.05) => db.query<{ id: string }>("select public.fortius_inmuebles_reservar_lectura_ia($1,$2,$3,$4,$5) id", [archivo, expediente, own, tope, reserva]);

beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${own}');
    insert into public.fortius_inmuebles_staff(user_id,role) values ('${own}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente de ensayo","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values ('${expediente}','c-own','own','EXP-1');
    insert into public.fortius_inmuebles_expediente_archivos(id,expediente_id,titulo,nombre_original,mime,byte_length,sha256,path,uploaded_by)
      values ('${archivo}','${expediente}','CURP','curp.pdf','application/pdf',512,'${"c".repeat(64)}','${expediente}/cliente/${archivo}.pdf','${own}');`);
});
afterAll(async () => { await db?.close(); });

it("cada reserva cuenta: al llegar al tope, la siguiente responde PT429", async () => {
  await db.exec("set role service_role");
  try {
    expect((await reservar(0.1)).rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect((await reservar(0.1)).rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    await expect(reservar(0.1)).rejects.toMatchObject({ code: "PT429" });
    // La reserva se convierte en la lectura con su costo real y deja de bloquear si costó menos.
    await db.query("update public.fortius_inmuebles_ia_lecturas set estado='leido', modelo='modelo-de-ensayo', costo_usd=0.01 where estado='reservada'");
    expect((await reservar(0.1)).rows[0].id).toBeTruthy();
    await expect(reservar(0.1, -1)).rejects.toMatchObject({ code: "PT400" });
  } finally { await db.exec("reset role"); }
});

it("una reserva abandonada deja de contar a los 15 minutos", async () => {
  await db.query("update public.fortius_inmuebles_ia_lecturas set created_at = now() - interval '20 minutes' where estado='reservada'");
  await db.query("update public.fortius_inmuebles_ia_lecturas set costo_usd = 0 where estado<>'reservada'");
  await db.exec("set role service_role");
  try { expect((await reservar(0.06)).rows[0].id).toBeTruthy(); } finally { await db.exec("reset role"); }
});

it("ni visitantes ni personal pueden reservar directo", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    try { await expect(reservar(100)).rejects.toThrow(/permission denied/); } finally { await db.exec("reset role"); }
  }
});
