import { afterAll, beforeAll, expect, it } from "vitest";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";
let db: PGlite;
const admin = "53000000-0000-4000-8000-000000000001",
  own = "53000000-0000-4000-8000-000000000002",
  other = "53000000-0000-4000-8000-000000000003";
async function asUser<T>(id: string | null, action: () => Promise<T>) {
  await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  try {
    return await action();
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${admin}'),('${own}'),('${other}');
 insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
 insert into public.fortius_inmuebles_records(collection,id,data) values
 ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
 ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
 ('clientes','existing','{"id":"existing","nombre":"Cliente existente","telefono":"6648889999","tipo":"propietario","asesorId":"own","notas":"Conservar","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
 insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');`);
});
afterAll(async () => {
  await db?.close();
});
const contact = (phone = "6641234567") => ({
  tipo: "nuevo",
  nombre: "Prospecto sintético",
  telefono: phone,
  email: "",
  asesorId: "own",
  telefonoCompartido: true,
});
async function start(
  intent = "vender",
  c: Record<string, unknown> = contact(),
  id = crypto.randomUUID(),
  exp: string | null = null,
) {
  return (
    await db.query<{ r: Record<string, unknown> }>(
      "select public.fortius_inmuebles_start_intake($1,$2,$3::jsonb,$4) r",
      [id, intent, JSON.stringify(exp ? c : {...c, seguimiento: {origen:"llamada",accion:"Revisar documentos",fecha:"2030-10-20"}}), exp],
    )
  ).rows[0].r;
}
const answers = (intent = "vender") => ({
  fecha: "2026-10-13",
  objetivo: "Iniciar operación",
  plazo: "Tres meses",
  zona: "Tijuana",
  tipoInmueble: "casa",
  presupuestoEstado: "por_definir",
  privacidad: "presentado",
  siguienteAccion: "Revisar documentos",
  siguienteFecha: "2030-10-20",
  ...(["vender", "arrendar"].includes(intent)
    ? {
        relacion: "propietario",
        ocupacion: "por_aclarar",
        documentos: "Por aclarar",
        alertas: "por_aclarar",
        estadoCivil: "soltero",
        ubicacion: "Colonia ficticia",
      }
    : {
        uso: "Vivienda",
        necesidades: "Dos recámaras",
        ...(["comprar", "invertir"].includes(intent)
          ? { financiamiento: "por_definir" }
          : {}),
        ...(intent === "invertir"
          ? { estrategia: "por_definir", horizonte: "Tres años" }
          : {}),
      }),
});
async function save(
  id: unknown,
  version: number,
  a: Record<string, string>,
  complete = false,
) {
  return (
    await db.query<{ r: Record<string, unknown> }>(
      "select public.fortius_inmuebles_save_intake($1,$2,$3::jsonb,$4) r",
      [id, version, JSON.stringify(a), complete],
    )
  ).rows[0].r;
}
it("persists partial answers without converting the prospect and detects another tab", async () =>
  asUser(own, async () => {
    const r = await start();
    const interview = await save(r.id, 1, { objetivo: "Quiero vender" });
    expect(interview.respuestas).toEqual({ objetivo: "Quiero vender", origenContacto: "llamada" });
    expect(
      (
        await db.query<{ data: Record<string, unknown> }>(
          "select data from public.fortius_inmuebles_records where collection='leads' and id=$1",
          [r.lead_id],
        )
      ).rows[0].data.clienteId,
    ).toBeUndefined();
    expect(
      (await db.query("select id from public.fortius_inmuebles_expedientes"))
        .rows,
    ).toHaveLength(0);
    await expect(save(r.id, 1, answers(), true)).rejects.toMatchObject({
      code: "PT409",
    });
  }));
it.each(["vender", "arrendar", "comprar", "rentar", "invertir"])(
  "completes %s with one snapshot, operation and dated task",
  async (intent) =>
    asUser(own, async () => {
      const r = await start(intent);
      const done = await save(r.id, 1, answers(intent), true);
      expect(done.estado).toBe("completada");
      expect(done.expediente_id).toBeTruthy();
      const exp = (
        await db.query<{
          operacion: string;
          etapa: string;
          flujo: { requisitos: Record<string, unknown> };
        }>(
          "select operacion,etapa,flujo from public.fortius_inmuebles_expedientes where id=$1",
          [done.expediente_id],
        )
      ).rows[0];
      expect(exp.operacion).toBe(
        ["arrendar", "rentar"].includes(intent) ? "renta" : intent === "invertir" ? "inversion" : "venta",
      );
      // El primer contacto deja la operación en captación (titular, 26/10/2026).
      expect(exp.etapa).toBe("captacion");
      const owner = ["vender", "arrendar"].includes(intent);
      const linked = (
        await db.query<{ propiedad_slug: string | null; unidad: string }>(
          "select propiedad_slug,unidad from public.fortius_inmuebles_expedientes where id=$1",
          [done.expediente_id],
        )
      ).rows[0];
      if (owner) {
        expect(linked.propiedad_slug).toBeTruthy();
        expect(done.propiedad_slug).toBe(linked.propiedad_slug);
        expect(linked.unidad).toBe("Colonia ficticia");
        const property = (
          await db.query<{ data: Record<string, unknown> }>(
            "select data from public.fortius_inmuebles_records where collection='propiedades' and id=$1",
            [linked.propiedad_slug],
          )
        ).rows[0].data;
        expect(property.publicada).toBe(false);
        expect(property.asesorId).toBe("own");
        expect(property.tipo).toBe("casa");
      } else expect(linked.propiedad_slug).toBeNull();
      if (exp.flujo) {
        expect(exp.flujo.requisitos.titularidad).toBeUndefined();
        expect(exp.flujo.requisitos.capacidad).toBeUndefined();
      }
      const again = await save(r.id, 1, answers(intent), true);
      expect(again.expediente_id).toBe(done.expediente_id);
      expect(
        (
          await db.query(
            "select id from public.fortius_inmuebles_records where collection='tareas' and data->>'expedienteId'=$1",
            [done.expediente_id],
          )
        ).rows,
      ).toHaveLength(1);
      await expect(
        save(r.id, 2, { ...answers(intent), objetivo: "Otro" }, true),
      ).rejects.toMatchObject({ code: "PT409" });
    }),
);
it("reuses an existing client without changing its profile and corrects without duplicating tasks", async () =>
  asUser(own, async () => {
    const before = (
      await db.query(
        "select data,version from public.fortius_inmuebles_records where collection='clientes' and id='existing'",
      )
    ).rows[0];
    const r = await start("comprar", { tipo: "cliente", id: "existing" });
    const done = await save(r.id, 1, answers("comprar"), true);
    const correction = await start(
      "comprar",
      { tipo: "cliente", id: "existing" },
      crypto.randomUUID(),
      done.expediente_id as string,
    );
    expect(correction.anterior_id).toBe(r.id);
    const fixed = await save(
      correction.id,
      1,
      { ...answers("comprar"), necesidades: "Tres recámaras" },
      true,
    );
    expect(fixed.expediente_id).toBe(done.expediente_id);
    expect(
      (
        await db.query(
          "select data,version from public.fortius_inmuebles_records where collection='clientes' and id='existing'",
        )
      ).rows[0],
    ).toEqual(before);
    expect(
      (
        await db.query(
          "select id from public.fortius_inmuebles_records where collection='tareas' and data->>'expedienteId'=$1",
          [done.expediente_id],
        )
      ).rows,
    ).toHaveLength(1);
  }));
it("uses a stable intake ID, rejects changed retry payloads and shared phones without acknowledgement", async () =>
  asUser(own, async () => {
    const id = crypto.randomUUID(),
      c = contact("6649901122");
    const first = await start("vender", c, id);
    expect((await start("vender", c, id)).id).toBe(first.id);
    await expect(start("comprar", c, id)).rejects.toMatchObject({
      code: "PT409",
    });
    await expect(
      start("vender", { ...c, telefonoCompartido: false }),
    ).rejects.toMatchObject({ code: "PT409" });
  }));
it("denies foreign adviser, unknown answers, incomplete interviews and direct snapshot updates", async () => {
  await asUser(own, async () => {
    await expect(
      start("vender", { ...contact(), asesorId: "other" }),
    ).rejects.toMatchObject({ code: "PT403" });
  });
  const r = await asUser(own, () => start());
  await asUser(other, async () => {
    expect(
      (
        await db.query(
          "select id from public.fortius_inmuebles_interviews where id=$1",
          [r.id],
        )
      ).rows,
    ).toHaveLength(0);
    await expect(save(r.id, 1, answers(), true)).rejects.toMatchObject({
      code: "PT403",
    });
  });
  await asUser(own, async () => {
    await expect(
      save(r.id, 1, { ...answers(), privacidad: "pendiente" }, true),
    ).rejects.toMatchObject({ code: "PT400" });
    await expect(save(r.id, 1, { foo: "bar" })).rejects.toMatchObject({
      code: "PT400",
    });
    await save(r.id, 1, answers(), true);
    await expect(
      db.query(
        "update public.fortius_inmuebles_interviews set respuestas='{}' where id=$1",
        [r.id],
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  await expect(
    db.query(
      "update public.fortius_inmuebles_interviews set respuestas='{}',version=version+1 where id=$1",
      [r.id],
    ),
  ).rejects.toMatchObject({ code: "PT409" });
});
it("rejects a second creation request while a matching draft exists", async () =>
  asUser(own, async () => {
    const a = await start("vender", contact("6642227788"));
    const b = crypto.randomUUID();
    await expect(
      start("vender", { tipo: "lead", id: a.lead_id }, b),
    ).rejects.toMatchObject({ code: "PT409" });
    await save(a.id, 1, answers(), true);
    expect((await start("vender", { tipo: "lead", id: a.lead_id }, b)).id).toBe(
      b,
    ); // The earlier creation was explicitly rejected, not acknowledged.
  }));
it("a correction preserves the initial action and refuses stale support after another correction", async () =>
  asUser(own, async () => {
    const a = await start("vender", contact("6642228899"));
    const done = await save(a.id, 1, answers(), true);
    const correction = await start(
      "vender",
      { tipo: "cliente", id: done.cliente_id },
      crypto.randomUUID(),
      done.expediente_id as string,
    );
    await expect(
      save(
        correction.id,
        1,
        { ...answers(), siguienteAccion: "Visitar otra casa" },
        true,
      ),
    ).rejects.toMatchObject({ code: "PT400" });
    const fixed = await save(
      correction.id,
      1,
      { ...answers(), objetivo: "Objetivo corregido" },
      true,
    );
    const row = (
      await db.query<{ flujo: Record<string, unknown>; version: number }>(
        "select flujo,version from public.fortius_inmuebles_expedientes where id=$1",
        [fixed.expediente_id],
      )
    ).rows[0];
    const changed = structuredClone(row.flujo) as {
      requisitos: { entrevista: { soporte: string } };
    };
    changed.requisitos.entrevista.soporte = `Entrevista operativa ${a.id} · versión 2. Declaraciones capturadas; documentos y capacidad pendientes de comprobar.`;
    await expect(
      db.query(
        "select public.fortius_inmuebles_update_operation($1,$2,'documentacion',null,'{}',$3::jsonb,null,false)",
        [fixed.expediente_id, row.version, JSON.stringify(changed)],
      ),
    ).rejects.toMatchObject({ code: "PT409" });
  }));
it("allows authorized context reassignment with pending reviews and requires a new interview to advance", async () => {
  const r = await asUser(own, () => start("vender", contact("6642229900")));
  const done = await asUser(own, () => save(r.id, 1, answers(), true));
  await asUser(admin, async () => {
    const client = (
      await db.query<{ data: Record<string, unknown>; version: number }>(
        "select data,version from public.fortius_inmuebles_records where collection='clientes' and id=$1",
        [done.cliente_id],
      )
    ).rows[0];
    await db.query(
      "select public.fortius_inmuebles_put_record('clientes',$1,$2::jsonb,$3)",
      [
        done.cliente_id,
        JSON.stringify({ ...client.data, asesorId: "other" }),
        client.version,
      ],
    );
    await db.query(
      "update public.fortius_inmuebles_expedientes set asesor_id='other',version=version+1 where id=$1",
      [done.expediente_id],
    );
    const house = (
      await db.query<{ propiedad_slug: string }>(
        "select propiedad_slug from public.fortius_inmuebles_expedientes where id=$1",
        [done.expediente_id],
      )
    ).rows[0];
    const property = (
      await db.query<{ data: Record<string, unknown>; version: number }>(
        "select data,version from public.fortius_inmuebles_records where collection='propiedades' and id=$1",
        [house.propiedad_slug],
      )
    ).rows[0];
    await db.query(
      "select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3)",
      [
        house.propiedad_slug,
        JSON.stringify({ ...property.data, asesorId: "other" }),
        property.version,
      ],
    );
  });
  await asUser(other, async () => {
    const pending = await start(
      "vender",
      { tipo: "cliente", id: done.cliente_id },
      crypto.randomUUID(),
      done.expediente_id as string,
    );
    expect(pending.asesor_id).toBe("other");
    await save(pending.id, 1, answers(), true);
  });
});
it("rolls back conversion, operation and snapshot if the next task fails", async () => {
  const r = await asUser(own, () => start("vender", contact("6645557799")));
  await db.exec(
    "create function public.intake_test_failure() returns trigger language plpgsql as $$begin if new.collection='tareas' then raise exception 'synthetic task failure';end if;return new;end;$$;create trigger intake_test_fail before insert or update on public.fortius_inmuebles_records for each row execute function public.intake_test_failure();",
  );
  try {
    await asUser(own, async () => {
      await expect(save(r.id, 1, answers(), true)).rejects.toThrow(
        "synthetic task failure",
      );
      const state = (
        await db.query(
          "select estado,version,expediente_id from public.fortius_inmuebles_interviews where id=$1",
          [r.id],
        )
      ).rows[0];
      expect(state).toMatchObject({
        estado: "borrador",
        version: 1,
        expediente_id: null,
      });
      expect(
        (
          await db.query<{ data: Record<string, unknown> }>(
            "select data from public.fortius_inmuebles_records where collection='leads' and id=$1",
            [r.lead_id],
          )
        ).rows[0].data.clienteId,
      ).toBeUndefined();
    });
  } finally {
    await db.exec(
      "drop trigger intake_test_fail on public.fortius_inmuebles_records;drop function public.intake_test_failure();",
    );
  }
});
it("cancels a reassigned prospect draft and allows the new responsible adviser to interview it", async () => {
  const r = await asUser(own, () => start("vender", contact("6646667788")));
  await asUser(admin, async () => {
    const source = (
      await db.query<{ data: Record<string, unknown>; version: number }>(
        "select data,version from public.fortius_inmuebles_records where collection='leads' and id=$1",
        [r.lead_id],
      )
    ).rows[0];
    await db.query(
      "select public.fortius_inmuebles_put_record('leads',$1,$2::jsonb,$3)",
      [
        r.lead_id,
        JSON.stringify({ ...source.data, asesorId: "other" }),
        source.version,
      ],
    );
  });
  await asUser(other, async () => {
    const old = (
      await db.query<{ estado: string }>(
        "select estado from public.fortius_inmuebles_interviews where id=$1",
        [r.id],
      )
    ).rows[0];
    expect(old.estado).toBe("cancelada");
    const next = await start("vender", { tipo: "lead", id: r.lead_id });
    expect(next.asesor_id).toBe("other");
    expect(next.id).not.toBe(r.id);
  });
});
it('keeps historical interviews within the current authorized client and operation scope',async()=>{
 const r=await asUser(own,()=>start('vender',contact('6646678899')));const done=await asUser(own,()=>save(r.id,1,answers(),true));
 await asUser(other,async()=>{expect((await db.query('select id from public.fortius_inmuebles_interviews where id=$1',[r.id])).rows).toHaveLength(0);});
 await asUser(admin,async()=>{const c=(await db.query<{data:Record<string,unknown>;version:number}>("select data,version from public.fortius_inmuebles_records where collection='clientes' and id=$1",[done.cliente_id])).rows[0];await db.query("select public.fortius_inmuebles_put_record('clientes',$1,$2::jsonb,$3)",[done.cliente_id,JSON.stringify({...c.data,asesorId:'other'}),c.version]);await db.query("update public.fortius_inmuebles_expedientes set asesor_id='other',version=version+1 where id=$1",[done.expediente_id]);});
 await asUser(own,async()=>{expect((await db.query('select id from public.fortius_inmuebles_interviews where id=$1',[r.id])).rows).toHaveLength(0);});
 await asUser(other,async()=>{expect((await db.query('select id from public.fortius_inmuebles_interviews where id=$1',[r.id])).rows).toHaveLength(1);});
});
