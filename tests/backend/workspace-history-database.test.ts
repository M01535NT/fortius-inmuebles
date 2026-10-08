import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
let db: PGlite;
const admin = "61000000-0000-4000-8000-000000000001",
  editor = "61000000-0000-4000-8000-000000000002";
async function asUser<T>(id: string, run: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  try {
    return await run();
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated,service_role;grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values('${admin}'),('${editor}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const f of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort())
    await db.exec(await readFile(new URL(f, dir), "utf8"));
  await db.exec(
    `insert into public.fortius_inmuebles_staff(user_id,role) values('${admin}','admin'),('${editor}','editor');`,
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
const post = (id: string) => ({
  id,
  slug: id,
  titulo: "Artículo",
  resumen: "Resumen",
  contenido: "Contenido",
  estado: "publicado",
  actualizadoEl: "2026-10-08",
});
test("first contact is stamped by the server and cannot be rewritten or removed",async()=>{
 await asUser(admin,async()=>{
  const lead={id:"first-contact",nombre:"Contacto",telefono:"6645551234",origen:"manual",estado:"nuevo",creadoEl:"2026-10-08",notas:[],firstContactedAt:"2000-01-01T00:00:00Z"};
  const put=async(data:object,version:number|null)=>db.query("select public.fortius_inmuebles_put_record('leads','first-contact',$1,$2)",[JSON.stringify(data),version]);
  const read=async()=> (await db.query<{data:Record<string,unknown>}>("select data from public.fortius_inmuebles_records where collection='leads' and id='first-contact'")).rows[0].data;
  await put(lead,null);expect((await read()).firstContactedAt).toBeUndefined();
  await put(lead,1);const stamp=(await read()).firstContactedAt;expect(stamp).toBeTruthy();expect(stamp).not.toBe(lead.firstContactedAt);
  await put({...lead,firstContactedAt:"2001-01-01T00:00:00Z"},2);expect((await read()).firstContactedAt).toBe(stamp);
  const without={...lead};delete (without as Partial<typeof lead>).firstContactedAt;
  await put(without,3);expect((await read()).firstContactedAt).toBe(stamp);
 });
});
test("server history captures actor and restore preserves data without republishing or stale versions", async () => {
  await asUser(admin, async () => {
    await db.query(
      "select public.fortius_inmuebles_put_record('posts','restore-post',$1,null)",
      [JSON.stringify(post("restore-post"))],
    );
    await db.query(
      "select public.fortius_inmuebles_delete_record('posts','restore-post',1)",
    );
    const rows = await db.query<{ id: string; actor_id: string }>(
      "select id,actor_id from public.fortius_inmuebles_record_history where record_id='restore-post' and action='DELETE'",
    );
    expect(rows.rows[0].actor_id).toBe(admin);
    await db.query("select public.fortius_inmuebles_restore_record($1)", [
      rows.rows[0].id,
    ]);
    const restored = await db.query<{
      version: number;
      data: { estado: string; titulo: string };
    }>(
      "select version::int,data from public.fortius_inmuebles_records where collection='posts' and id='restore-post'",
    );
    expect(restored.rows[0].version).toBeGreaterThan(1);
    expect(restored.rows[0].data.estado).toBe("borrador");
    expect(restored.rows[0].data.titulo).toBe("Artículo");
    await expect(
      db.query("select public.fortius_inmuebles_restore_record($1)", [
        rows.rows[0].id,
      ]),
    ).rejects.toMatchObject({ code: "PT409" });
  });
});
test("editors cannot read history or restore, and restoration never overwrites a replacement", async () => {
  let historyId = "";
  await asUser(admin, async () => {
    await db.query(
      "select public.fortius_inmuebles_put_record('posts','replacement',$1,null)",
      [JSON.stringify(post("replacement"))],
    );
    await db.query(
      "select public.fortius_inmuebles_delete_record('posts','replacement',1)",
    );
    historyId = (
      await db.query<{ id: string }>(
        "select id from public.fortius_inmuebles_record_history where record_id='replacement' and action='DELETE'",
      )
    ).rows[0].id;
    await db.query(
      "select public.fortius_inmuebles_put_record('posts','replacement',$1,null)",
      [JSON.stringify(post("replacement"))],
    );
    await expect(
      db.query("select public.fortius_inmuebles_restore_record($1)", [
        historyId,
      ]),
    ).rejects.toMatchObject({ code: "PT409" });
  });
  await asUser(editor, async () => {
    expect(
      (await db.query("select * from public.fortius_inmuebles_record_history"))
        .rows,
    ).toEqual([]);
    await expect(
      db.query("select public.fortius_inmuebles_restore_record($1)", [
        historyId,
      ]),
    ).rejects.toMatchObject({ code: "PT403" });
  });
});
