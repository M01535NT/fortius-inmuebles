import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { putRecord } from "@/lib/backend/repository";

let db: PGlite;
const member = "10000000-0000-4000-8000-000000000001";
const outsider = "10000000-0000-4000-8000-000000000002";
const adviser = { id: "a1", nombre: "Ana", cargo: "Asesora", iniciales: "AA", activo: true, email: "privado@example.com", notasInternas: "NO PUBLICAR" };
const property = { slug: "casa-1", codigo: "C-1", titulo: "Casa", tipo: "casa", operacion: "venta", precio: { modalidad: "consulta", secreto: "NO PUBLICAR" }, zona: "Tijuana", direccionAproximada: "Zona centro", descripcion: ["Casa"], ficha: { terrenoM2: 100, propietario: "NO PUBLICAR" }, amenidades: [], galeria: [{ src: "/casa.webp", alt: "Casa", secreto: "NO PUBLICAR" }], documentos: [{ codigo: "D1", nombre: "Ficha", descripcion: "PDF", url: "/ficha.pdf", secreto: "NO PUBLICAR" }], asesorId: "a1", creditoDisponible: true, puntosDeInteres: [], destacada: true, estado: "disponible", publicadaEl: "2026-09-02", demo: false, publicada: true, notasInternas: "NO PUBLICAR" };

async function asRole<T>(role: string, uid: string | null, run: () => Promise<T>) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid ?? ""]);
  try { return await run(); } finally { await db.exec("reset role"); }
}
async function save(collection: string, id: string, data: unknown, version: number | null = null) {
  const result = await db.query<{ record: { version: number; data: Record<string, unknown> } }>("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,$4::bigint) as record", [collection, id, JSON.stringify(data), version]);
  return result.rows[0].record;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    create schema storage; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role; grant all on storage.objects to anon, authenticated, service_role;
    insert into auth.users values ('${member}'), ('${outsider}');`);
  const migration = await readFile(new URL("../../supabase/migrations/202609030001_fortius_inmuebles_backend.sql", import.meta.url), "utf8");
  try { await db.exec(migration); } catch (error) {
    const details = error as { position?: number; internalPosition?: number; internalQuery?: string; message?: string };
    throw new Error(`SQL migration failed at ${details.position ?? details.internalPosition}: ${details.message}; ${details.internalQuery ?? ""}`, { cause: error });
  }
  await db.exec(await readFile(new URL("../../supabase/migrations/202609030002_fortius_inmuebles_record_revisions.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/202609060003_fortius_inmuebles_identity.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/20261005035035_fortius_inmuebles_identity.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/20261010131109_fortius_public_property_facts.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/20261018120000_property_escenario_fields.sql", import.meta.url), "utf8"));
});
afterAll(async () => { await db?.close(); });

describe("PostgreSQL policy and atomic persistence contract", () => {
  beforeEach(async () => {
    // Run bootstrap as owner; the tested operations below switch to real DB roles.
    // Only this disposable in-memory DB resets revision metadata between tests.
    await db.exec("truncate public.fortius_inmuebles_records cascade; truncate public.fortius_inmuebles_record_revisions; truncate public.fortius_inmuebles_rate_limits; delete from public.fortius_inmuebles_staff;");
    await db.query("insert into public.fortius_inmuebles_staff(user_id,role) values ($1,'admin')", [member]);
  });

  it("persists create/update, rejects stale updates and duplicate creates", async () => {
    await asRole("authenticated", member, async () => {
      expect((await save("asesores", "a1", adviser)).version).toBe(1);
      expect((await save("asesores", "a1", { ...adviser, nombre: "Ana María" }, 1)).version).toBe(2);
      await expect(save("asesores", "a1", adviser, 1)).rejects.toMatchObject({ code: "PT409" });
      await expect(save("asesores", "a1", adviser)).rejects.toMatchObject({ code: "PT409" });
      const result = await db.query<{ data: Record<string, unknown> }>("select data from public.fortius_inmuebles_records where id='a1'");
      expect(result.rows[0].data.nombre).toBe("Ana María");
    });
  });

  it("denies anonymous private reads and mutations even with valid payloads", async () => {
    await asRole("anon", null, async () => {
      await expect(db.query("select * from public.fortius_inmuebles_records")).rejects.toMatchObject({ code: "42501" });
      await expect(save("asesores", "a1", adviser)).rejects.toMatchObject({ code: "42501" });
      await expect(db.query("select * from public.fortius_inmuebles_staff")).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("authenticated outsiders cannot read, mutate, or grant themselves membership", async () => {
    await asRole("authenticated", outsider, async () => {
      expect((await db.query("select * from public.fortius_inmuebles_records")).rows).toEqual([]);
      await expect(save("asesores", "a1", adviser)).rejects.toMatchObject({ code: "PT403" });
      await expect(db.query("insert into public.fortius_inmuebles_staff(user_id,role) values ($1,'admin')", [outsider])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("requires versions even for direct staff writes and rejects invalid data", async () => {
    await asRole("authenticated", member, async () => {
      await expect(db.query("insert into public.fortius_inmuebles_records(collection,id,data) values ('notas','n1','{}')")).rejects.toMatchObject({ code: "42501" });
      await expect(save("staff", "x", {})).rejects.toMatchObject({ code: "PT400" });
      await expect(save("asesores", "wrong", adviser)).rejects.toMatchObject({ code: "PT400" });
      await expect(save("propiedades", "broken", { slug: "broken" })).rejects.toMatchObject({ code: "PT400" });
    });
  });

  it("rejects private objects hidden inside public scalar fields", async () => {
    await asRole("authenticated", member, async () => {
      await save("asesores", "a1", adviser);
      await expect(save("propiedades", "casa-1", { ...property, ficha: { terrenoM2: { nombre: "secreto" } } })).rejects.toMatchObject({ code: "PT400" });
      await expect(save("propiedades", "casa-1", { ...property, descripcion: [{ nombre: "secreto" }] })).rejects.toMatchObject({ code: "PT400" });
      await expect(save("propiedades", "casa-1", { ...property, galeria: [{ src: "/x.webp", alt: { nombre: "secreto" } }] })).rejects.toMatchObject({ code: "PT400" });
    });
  });

  it("repository validates and persists via the actual database, mapping stale writes to 409", async () => {
    const client = { rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn !== "fortius_inmuebles_put_record") throw new Error("Unexpected RPC");
      try { return { data: await save(String(args.p_collection), String(args.p_id), args.p_data, args.p_version as number | null), error: null }; }
      catch (error) { return { data: null, error }; }
    } } as unknown as Parameters<typeof putRecord>[0];
    await asRole("authenticated", member, async () => {
      const first = await putRecord(client, "asesores", "a1", { data: adviser, version: null });
      expect(first.version).toBe(1);
      const second = await putRecord(client, "asesores", "a1", { data: { ...adviser, nombre: "Cambio" }, version: first.version });
      expect(second.data.nombre).toBe("Cambio");
      await expect(putRecord(client, "asesores", "a1", { data: adviser, version: 1 })).rejects.toMatchObject({ status: 409 });
    });
  });

  it("prevents deletion of a referenced adviser and stale deletion", async () => {
    await asRole("authenticated", member, async () => {
      await save("asesores", "a1", adviser);
      await save("propiedades", "casa-1", property);
      await expect(db.query("select public.fortius_inmuebles_delete_record('asesores','a1',1)")).rejects.toMatchObject({ code: "PT409" });
      await expect(db.query("select public.fortius_inmuebles_delete_record('propiedades','casa-1',7)")).rejects.toMatchObject({ code: "PT409" });
      await db.query("select public.fortius_inmuebles_delete_record('propiedades','casa-1',1)");
      await db.query("select public.fortius_inmuebles_delete_record('asesores','a1',1)");
      expect((await db.query("select * from public.fortius_inmuebles_records")).rows).toEqual([]);
    });
  });

  it("anonymous projection excludes drafts, private fields and nested private keys", async () => {
    await asRole("authenticated", member, async () => {
      await save("asesores", "a1", adviser);
      await save("propiedades", "casa-1", property);
      await save("propiedades", "borrador", { ...property, slug: "borrador", publicada: false });
    });
    await asRole("anon", null, async () => {
      const rows = (await db.query<{ data: Record<string, unknown> }>("select * from public.fortius_inmuebles_public_records('propiedades')")).rows;
      expect(rows).toHaveLength(1);
      expect(rows[0].data.slug).toBe("casa-1");
      expect(JSON.stringify(rows)).not.toContain("NO PUBLICAR");
      expect(rows[0].data.demo).toBe(false);
      expect((await db.query("select * from public.fortius_inmuebles_public_records('leads')")).rows).toEqual([]);
      const agents = (await db.query<{ data: Record<string, unknown> }>("select * from public.fortius_inmuebles_public_records('asesores')")).rows;
      expect(agents[0].data.email).toBeUndefined();
    });
  });

  it.each(["videoInstitucionalUrl", "facebook", "instagram", "whatsapp"])("anonymous configuration projection blanks private capabilities in %s but retains other settings", async (field) => {
    const settings = { nombreComercial: "MNT", telefono: "6641234567", whatsapp: "526641234567", email: "contacto@example.com", horario: "Lunes a viernes", facebook: "https://www.facebook.com/mnt", instagram: "https://www.instagram.com/mnt/", videoInstitucionalUrl: "https://assets.example.com/storage/v1/object/public/fortius-inmuebles-public/video.mp4" };
    let version: number | null = null;
    for (const unsafe of [
      "https://assets.example.com/storage/v1/object/sign/fortius-inmuebles-private/video.mp4?token=PRIVATE_CAPABILITY",
      "/api/admin/files?bucket=fortius-inmuebles-private&path=video.mp4",
      "https://assets.example.com/storage/v1/object/authenticated/fortius-inmuebles-private/video.mp4",
      "javascript:alert(1)",
    ]) {
      await asRole("authenticated", member, async () => {
        const saved = await save("config", "singleton", { ...settings, [field]: unsafe }, version);
        version = saved.version;
        expect(saved.data[field]).toBe(unsafe);
      });
      await asRole("anon", null, async () => {
        const rows = (await db.query<{ data: Record<string, unknown> }>("select * from public.fortius_inmuebles_public_records('config')")).rows;
        expect(rows).toEqual([{ data: { ...settings, [field]: "" } }]);
      });
    }
  });

  it("anonymous configuration keeps legitimate public links, local video and empty URLs", async () => {
    const settings = { nombreComercial: "MNT", telefono: "6641234567", whatsapp: "https://wa.me/526640000000", email: "contacto@example.com", horario: "Lunes a viernes", facebook: "https://www.facebook.com/mnt", instagram: "https://www.instagram.com/mnt/", videoInstitucionalUrl: "/media/institucional.mp4" };
    await asRole("authenticated", member, async () => { await save("config", "singleton", settings); });
    await asRole("anon", null, async () => {
      expect((await db.query("select * from public.fortius_inmuebles_public_records('config')")).rows).toEqual([{ data: settings }]);
    });
    const emptyLinks = { ...settings, facebook: "", instagram: "", videoInstitucionalUrl: "", whatsapp: "" };
    await asRole("authenticated", member, async () => { await save("config", "singleton", emptyLinks, 1); });
    await asRole("anon", null, async () => {
      expect((await db.query("select * from public.fortius_inmuebles_public_records('config')")).rows).toEqual([{ data: emptyLinks }]);
    });
  });

  it("captures leads only through privileged BFF and limits repeated submissions atomically", async () => {
    const lead = { nombre: "Persona", telefono: "6641234567", origen: "contacto" };
    await asRole("anon", null, async () => {
      await expect(db.query("select public.fortius_inmuebles_capture_lead($1::jsonb,$2)", [JSON.stringify(lead), "ip-test"])).rejects.toMatchObject({ code: "42501" });
    });
    await asRole("service_role", null, async () => {
      for (let i = 0; i < 5; i++) {
        const result = await db.query<{ id: string }>("select public.fortius_inmuebles_capture_lead($1::jsonb,$2) as id", [JSON.stringify(lead), "ip-test"]);
        expect(result.rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
      }
      await expect(db.query("select public.fortius_inmuebles_capture_lead($1::jsonb,$2)", [JSON.stringify(lead), "ip-test"])).rejects.toMatchObject({ code: "PT429" });
    });
    expect((await db.query("select * from public.fortius_inmuebles_records where collection='leads'")).rows).toHaveLength(5);
  });

  it("post projection still exposes only explicitly public posts without authentication", async () => {
    const post = { id: "p1", slug: "guia", titulo: "Guía", resumen: "Resumen", contenido: "Texto", estado: "publicado", actualizadoEl: "2026-09-03", privateNote: "NO PUBLICAR" };
    await asRole("authenticated", member, async () => {
      await save("posts", "p1", post);
      await save("posts", "p2", { ...post, id: "p2", slug: "guia-borrador", estado: "borrador" });
    });
    await asRole("anon", null, async () => {
      const rows = (await db.query<{ data: Record<string, unknown> }>("select * from public.fortius_inmuebles_public_records('posts')")).rows;
      expect(rows).toHaveLength(1);
      expect(rows[0].data).toMatchObject({ id: "p1", estado: "publicado", contenido: "Texto" });
      expect(JSON.stringify(rows)).not.toContain("NO PUBLICAR");
    });
  });

  it("storage private objects remain inaccessible to anonymous and nonmember users", async () => {
    await db.query("insert into storage.objects(bucket_id,name) values ('fortius-inmuebles-private','private.pdf')");
    await asRole("anon", null, async () => { expect((await db.query("select * from storage.objects")).rows).toEqual([]); });
    await asRole("authenticated", outsider, async () => { expect((await db.query("select * from storage.objects")).rows).toEqual([]); });
    await asRole("authenticated", member, async () => { expect((await db.query("select * from storage.objects")).rows).toHaveLength(1); });
  });

  it("staff cannot bypass content validation by directly inserting final or staging objects", async () => {
    await db.query("insert into storage.objects(bucket_id,name) values ('fortius-inmuebles-staging','pending.pdf')");
    await asRole("authenticated", member, async () => {
      expect((await db.query("select * from storage.objects where bucket_id='fortius-inmuebles-staging'")).rows).toEqual([]);
      await expect(db.query("insert into storage.objects(bucket_id,name) values ('fortius-inmuebles-public','unvalidated.pdf')")).rejects.toMatchObject({ code: "42501" });
      await expect(db.query("insert into storage.objects(bucket_id,name) values ('fortius-inmuebles-staging','unvalidated.pdf')")).rejects.toMatchObject({ code: "42501" });
    });
  });
});

 it("SQL public projection preserves approved facts and strips unknown nested fields", async () => {
    await asRole("authenticated", member, async () => {
      await save("asesores", "info-adviser", {...adviser,id:"info-adviser"});
      await save("propiedades", "info-property", {...property,slug:"info-property",asesorId:"info-adviser",informacionPublica:{fuenteTerreno:"escritura",ocupacionEntrega:"Libre",propietario:"NEVER_PUBLIC"}});
    });
    const result=await asRole("anon", null, () => db.query<{data: Record<string,unknown>}>("select data from public.fortius_inmuebles_public_records('propiedades') where data->>'slug'='info-property'"));
    expect(result.rows[0].data.informacionPublica).toEqual({fuenteTerreno:"escritura",ocupacionEntrega:"Libre"});
    expect(JSON.stringify(result.rows)).not.toContain("NEVER_PUBLIC");
 });

 it("Escenario fields are validated on write and published only when well formed", async () => {
    const escenario = {
      puntosDeInteres: [{ lugar: "Malecón", minutos: 5, categoria: "playa", privado: "NEVER_PUBLIC" }, { lugar: "Plaza", minutos: 7 }],
      beneficios: [{ titulo: "Vista al mar", texto: "Orientación poniente.", privado: "NEVER_PUBLIC" }],
      caracteristicas: [{ grupo: "interior", elementos: ["Doble altura"], privado: "NEVER_PUBLIC" }],
      costos: { predialAnual: 18500, mantenimientoMensual: 2500, privado: "NEVER_PUBLIC" },
    };
    await asRole("authenticated", member, async () => {
      await save("asesores", "esc-adviser", {...adviser,id:"esc-adviser"});
      await save("propiedades", "esc-property", {...property,slug:"esc-property",codigo:"ESC-1",asesorId:"esc-adviser",...escenario});
      for (const invalid of [
        { puntosDeInteres: [{ lugar: "X", minutos: 1, categoria: "casino" }] },
        { beneficios: [{ titulo: "", texto: "" }] },
        { beneficios: Array.from({ length: 5 }, (_, i) => ({ titulo: `B${i}`, texto: "" })) },
        { caracteristicas: [{ grupo: "secreto", elementos: [] }] },
        { caracteristicas: [{ grupo: "interior", elementos: [42] }] },
        { costos: { predialAnual: -1 } },
      ]) await expect(save("propiedades", "esc-invalid", {...property,slug:"esc-invalid",codigo:"ESC-2",asesorId:"esc-adviser",...invalid})).rejects.toMatchObject({ code: "PT400" });
    });
    const result=await asRole("anon", null, () => db.query<{data: Record<string,unknown>}>("select data from public.fortius_inmuebles_public_records('propiedades') where data->>'slug'='esc-property'"));
    const data=result.rows[0].data;
    expect(data.puntosDeInteres).toEqual([{ lugar: "Malecón", minutos: 5, categoria: "playa" }, { lugar: "Plaza", minutos: 7 }]);
    expect(data.beneficios).toEqual([{ titulo: "Vista al mar", texto: "Orientación poniente." }]);
    expect(data.caracteristicas).toEqual([{ grupo: "interior", elementos: ["Doble altura"] }]);
    expect(data.costos).toEqual({ predialAnual: 18500, mantenimientoMensual: 2500 });
    expect(JSON.stringify(result.rows)).not.toContain("NEVER_PUBLIC");
 });

 it("does not publish objects smuggled into an approved public scalar key", async () => {
    await asRole("authenticated", member, async () => {
      await save("asesores", "scalar-adviser", {...adviser,id:"scalar-adviser"});
      await save("propiedades", "scalar-property", {...property,slug:"scalar-property",asesorId:"scalar-adviser",informacionPublica:{ocupacionEntrega:{private:"NEVER_PUBLIC"}}});
    });
    const result=await asRole("anon", null, () => db.query<{data: Record<string,unknown>}>("select data from public.fortius_inmuebles_public_records('propiedades') where data->>'slug'='scalar-property'"));
    expect(result.rows[0].data.informacionPublica).toEqual({});
    expect(JSON.stringify(result.rows)).not.toContain("NEVER_PUBLIC");
 });
