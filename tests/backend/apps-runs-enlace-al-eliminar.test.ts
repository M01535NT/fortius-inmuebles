import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

// Decisión del titular (13/11/2026): mandar a Eliminados un trabajo con QR apaga su enlace compartido.
let db: PGlite;
const own = "56000000-0000-4000-8000-000000000002";
const other = "56000000-0000-4000-8000-000000000003";
const file = "57000000-0000-4000-8000-000000000001";
const share = "58000000-0000-4000-8000-000000000001";
const foreignShare = "58000000-0000-4000-8000-000000000002";

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
    insert into auth.users values ('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(dir)).filter(item => item.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(name, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_app_files(id,owner_id,name,path,mime,size_bytes,sha256) values ('${file}','${own}','ficha.pdf','apps/${own}/ficha.pdf','application/pdf',10,'${"0".repeat(64)}');
    insert into public.fortius_inmuebles_app_shares(id,file_id,token_hash,owner_id,expires_at) values
      ('${share}','${file}','${"1".repeat(64)}','${own}',now()+interval '7 days'),
      ('${foreignShare}','${file}','${"2".repeat(64)}','${other}',now()+interval '7 days');`);
});
afterAll(async () => { await db?.close(); });

async function asOwn<T>(action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [own]);
  try { return await action(); } finally { await db.exec("reset role"); }
}
const revoked = async (id: string) => (await db.query<{ revoked: boolean }>("select revoked from public.fortius_inmuebles_app_shares where id=$1", [id])).rows[0].revoked;
const run = (shareId: string) => asOwn(async () => (await db.query<{ id: string }>(
  "insert into public.fortius_inmuebles_app_runs(slug,title,input,context) values ('qr','QR de ensayo',$1::jsonb,'{}'::jsonb) returning id",
  [JSON.stringify({ kind: "private", fileId: file, shareId })])).rows[0].id);
const trash = (id: string) => asOwn(() => db.query("update public.fortius_inmuebles_app_runs set deleted_at=now(), version=version+1 where id=$1", [id]));

it("mandar el trabajo a Eliminados apaga su enlace", async () => {
  const id = await run(share);
  expect(await revoked(share)).toBe(false);
  await trash(id);
  expect(await revoked(share)).toBe(true);
});

it("un trabajo no puede apagar el enlace de otra persona", async () => {
  await trash(await run(foreignShare));
  expect(await revoked(foreignShare)).toBe(false);
});
