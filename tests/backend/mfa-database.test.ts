import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, expect, it } from "vitest";

// AUT-01: en la base, quien tiene la app registrada solo cuenta como personal con sesión «aal2».
const director = "10000000-0000-4000-8000-000000000001";
const asesor = "10000000-0000-4000-8000-000000000002";
const migration = () => readFile(new URL("../../supabase/migrations/20261113180000_dos_pasos_del_director.sql", import.meta.url), "utf8");
const base = `
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create table public.fortius_inmuebles_staff(user_id uuid primary key, role text, active boolean);
  create table public.fortius_inmuebles_adviser_accounts(user_id uuid primary key, asesor_id text);
  insert into public.fortius_inmuebles_staff values ('${director}','admin',true),('${asesor}','editor',true);
  insert into public.fortius_inmuebles_adviser_accounts values ('${asesor}','asesor-1');
  create function public.fortius_inmuebles_is_staff() returns boolean language sql stable as $$ select true $$;
`;
let db: PGlite;
let local: PGlite;
const as = async (sub: string, aal: string, sql: string) => {
  await db.exec(`select set_config('request.jwt.claim.sub','${sub}',false), set_config('request.jwt.claims','{"aal":"${aal}"}',false);`);
  return (await db.query<{ v: unknown }>(`select ${sql} as v`)).rows[0].v;
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(base + `
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create table auth.mfa_factors(id uuid primary key default gen_random_uuid(), user_id uuid, status text);
    insert into auth.mfa_factors(user_id,status) values ('${director}','verified'),('${asesor}','unverified');
  `);
  await db.exec(await migration());
  local = new PGlite();
  await local.exec(base);
  await local.exec(await migration());
});
afterAll(async () => { await db.close(); await local.close(); });

it("el director con la app registrada necesita la sesión con código", async () => {
  expect(await as(director, "aal1", "public.fortius_inmuebles_is_admin()")).toBe(false);
  expect(await as(director, "aal1", "public.fortius_inmuebles_is_staff()")).toBe(false);
  expect(await as(director, "aal2", "public.fortius_inmuebles_is_admin()")).toBe(true);
  expect(await as(director, "aal2", "public.fortius_inmuebles_is_staff()")).toBe(true);
});

it("sin app verificada nada cambia", async () => {
  expect(await as(asesor, "aal1", "public.fortius_inmuebles_is_staff()")).toBe(true);
  expect(await as(asesor, "aal1", "public.fortius_inmuebles_current_asesor_id()")).toBe("asesor-1");
  expect(await as(asesor, "aal1", "public.fortius_inmuebles_is_admin()")).toBe(false);
});

it("en el ensayo local, sin auth.jwt ni auth.mfa_factors, no toca las funciones", async () => {
  expect((await local.query<{ v: boolean }>("select public.fortius_inmuebles_is_staff() as v")).rows[0].v).toBe(true);
  expect((await local.query("select to_regprocedure('public.fortius_inmuebles_mfa_ok()') as v")).rows[0]).toEqual({ v: null });
});
