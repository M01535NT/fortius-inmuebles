/** Explicit live check: three temporary Auth accounts, synthetic records, scoped cleanup. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

assert.equal(process.argv[2], "--run");
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, "qkkirjzhviqwvuqjnmei.supabase.co");
const origin = "http://localhost:3000";
const server = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const run = randomUUID(), prefix = `qa-lead-${run}`, users = [], records = [], sessions = [];
const manifest = () => writeFile(".qa-comercial/live-lead-manifest.json", JSON.stringify({ run, users, records }, null, 2));
const apiPath = (collection, id) => `/api/admin/collections/${collection}/${id}`;
async function account(role, suffix) {
  const email = `fortius-inmuebles-qa-lead-${run}-${suffix}@example.invalid`, password = randomBytes(32).toString("base64url");
  const created = await server.auth.admin.createUser({ email, password, email_confirm: true }); assert.ifError(created.error);
  const id = created.data.user.id; users.push(id); await manifest();
  assert.ifError((await server.from("fortius_inmuebles_staff").insert({ user_id: id, role, active: true })).error);
  const cookies = new Map();
  const request = async (path, method = "GET", data) => {
    const headers = new Headers({ Origin: origin });
    if (cookies.size) headers.set("Cookie", [...cookies].map(([key, value]) => `${key}=${value}`).join("; "));
    if (data !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(origin + path, { method, headers, body: data === undefined ? undefined : JSON.stringify(data), redirect: "manual" });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0], split = pair.indexOf("="); cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    return { status: response.status, data: await response.json() };
  };
  sessions.push(request);
  assert.equal((await request("/api/auth/login", "POST", { email, password })).status, 200);
  return { id, request };
}
async function create(who, collection, data) {
  records.push({ collection, id: data.id }); await manifest();
  const response = await who.request(apiPath(collection, data.id), "PUT", { version: null, data });
  assert.equal(response.status, 200, JSON.stringify(response.data));
  return response.data.record;
}
let failed, cleanupFailed;
try {
  const admin = await account("admin", "admin"), own = await account("editor", "own"), other = await account("editor", "other");
  for (const [who, suffix] of [[own, "own"], [other, "other"]]) {
    const adviser = `${prefix}-${suffix}`;
    await create(admin, "asesores", { id: adviser, nombre: `QA ${suffix}`, cargo: "Asesor", iniciales: "QA", activo: true });
    assert.ifError((await server.from("fortius_inmuebles_adviser_accounts").insert({ user_id: who.id, asesor_id: adviser })).error);
  }
  const original = { id: `${prefix}-source`, nombre: "Persona sintética de conversión", telefono: "6640000000", email: `qa-${run}@example.invalid`, asesorId: `${prefix}-own`, origen: "manual", estado: "contactado", creadoEl: "2026-10-04", notas: [{ id: "n1", texto: "Nota sintética anterior", fecha: "2026-10-04" }], zona: "Otay", tipoPropiedad: "casa", mensaje: "Consulta sintética", perfil: { operacion: "comprar", presupuestoMax: 250000, moneda: "USD", requisitos: "Acceso sin escalones", futureField: "Conservar" }, campoFuturo: "Conservar también" };
  await create(admin, "leads", original);
  const path = `/api/admin/leads/${original.id}/convertir`;
  assert.equal((await other.request(path, "POST", { version: 1 })).status, 403);
  console.log("PASS foreign adviser cannot convert");
  const results = await Promise.all([own.request(path, "POST", { version: 1 }), own.request(path, "POST", { version: 1 })]);
  for (const response of results) assert.equal(response.status, 200, JSON.stringify(response.data));
  const client = results[0].data.cliente;
  assert.equal(results[1].data.cliente.id, client.id);
  assert.deepEqual(client.data.leadOriginal, { id: original.id, creadoEl: original.creadoEl, notas: original.notas });
  assert.deepEqual(client.data.perfil, original.perfil);
  assert.equal(client.data.campoFuturo, original.campoFuturo);
  assert.equal(client.data.tipo, "comprador");
  assert.equal(client.data.asesorId, original.asesorId);
  const list = await own.request("/api/admin/collections/clientes");
  assert.equal(list.data.records.filter(item => item.data.leadId === original.id).length, 1);
  console.log("PASS simultaneous conversions create one client and preserve all captured data");
  const edited = { ...client.data, notas: "Nueva nota del cliente", perfil: { ...client.data.perfil, presupuestoMax: 260000 } };
  assert.equal((await own.request(apiPath("clientes", client.id), "PUT", { version: 1, data: edited })).status, 200);
  const repeated = await own.request(path, "POST", { version: 1 });
  assert.equal(repeated.status, 200); assert.equal(repeated.data.cliente.id, client.id);
  assert.equal(repeated.data.cliente.version, 2); assert.deepEqual(repeated.data.cliente.data, edited);
  assert.equal((await other.request(path, "POST", { version: 1 })).status, 403);
  assert.equal((await other.request("/api/admin/collections/clientes")).data.records.some(item => item.id === client.id), false);
  console.log("PASS retries preserve later client edits and private access");
  const stripped = { ...repeated.data.lead.data }; delete stripped.clienteId;
  assert.equal((await own.request(apiPath("leads", original.id), "PUT", { version: 2, data: stripped })).status, 403);
  const forged = { ...edited, leadOriginal: {} };
  assert.equal((await own.request(apiPath("clientes", client.id), "PUT", { version: 2, data: forged })).status, 400);
  assert.equal((await own.request(apiPath("leads", original.id), "DELETE", { version: 2 })).status, 409);
  console.log("PASS conversion origin cannot be removed or falsified");
  const stale = { ...original, id: `${prefix}-stale`, notas: [] };
  await create(admin, "leads", stale);
  assert.equal((await own.request(apiPath("leads", stale.id), "PUT", { version: 1, data: { ...stale, nombre: "Cambio sintético" } })).status, 200);
  assert.equal((await own.request(`/api/admin/leads/${stale.id}/convertir`, "POST", { version: 1 })).status, 409);
  const newList = await own.request("/api/admin/collections/clientes");
  assert.equal(newList.data.records.some(item => item.data.leadId === stale.id), false);
  console.log("PASS stale version leaves no partially converted client");
  const reassigned = { ...edited, asesorId: `${prefix}-other` };
  assert.equal((await admin.request(apiPath("clientes", client.id), "PUT", { version: 2, data: reassigned })).status, 200);
  const newAdviserLeads = await other.request("/api/admin/collections/leads");
  assert.equal(newAdviserLeads.data.records.find(item => item.id === original.id).data.asesorId, `${prefix}-other`);
  assert.equal((await own.request("/api/admin/collections/leads")).data.records.some(item => item.id === original.id), false);
  console.log("PASS reassignment retains access to history for the new adviser");
  const unassigned = { ...original, id: `${prefix}-unassigned`, asesorId: undefined, perfil: undefined, notas: [] };
  await create(admin, "leads", unassigned);
  assert.equal((await own.request(`/api/admin/leads/${unassigned.id}/convertir`, "POST", { version: 1 })).status, 403);
  const byAdmin = await admin.request(`/api/admin/leads/${unassigned.id}/convertir`, "POST", { version: 1 });
  assert.equal(byAdmin.status, 200, JSON.stringify(byAdmin.data)); assert.equal(byAdmin.data.cliente.data.tipo, "otro");
  console.log("PASS administrator converts unassigned leads without assuming an operation");
} catch (error) { failed = error; console.error(error.message); }
finally {
  for (const request of sessions) { try { await request("/api/auth/logout", "POST"); } catch { /* membership is removed below */ } }
  const quote = value => { assert.match(value, /^[a-zA-Z0-9_-]+$/); return `'${value}'`; };
  const list = values => values.map(quote).join(",") || "NULL";
  const leadIds = records.filter(item => item.collection === "leads").map(item => item.id);
  const predicates = records.map(item => `(collection=${quote(item.collection)} and id=${quote(item.id)})`).join(" or ") || "false";
  const sql = `begin;
set local lock_timeout='2s'; set local statement_timeout='15s';
do $$begin if exists(select 1 from auth.users where id in (${list(users)}) and email not like 'fortius-inmuebles-qa-lead-${run}-%@example.invalid') then raise exception 'Unexpected account'; end if; end;$$;
create temporary table qa_lead_cleanup on commit drop as select collection,id from public.fortius_inmuebles_records where ${predicates} or (collection='clientes' and id in(select cliente_id from public.fortius_inmuebles_lead_conversions where lead_id in (${list(leadIds)})));
do $$begin if exists(select 1 from public.fortius_inmuebles_record_references r join qa_lead_cleanup target on (r.target_collection,r.target_id)=(target.collection,target.id) where not exists(select 1 from qa_lead_cleanup source where (r.source_collection,r.source_id)=(source.collection,source.id))) then raise exception 'External reference to test data'; end if; end;$$;
delete from public.fortius_inmuebles_lead_conversions where lead_id in (${list(leadIds)});
delete from public.fortius_inmuebles_adviser_accounts where user_id in (${list(users)});
delete from public.fortius_inmuebles_record_references r using qa_lead_cleanup t where (r.source_collection,r.source_id)=(t.collection,t.id);
delete from public.fortius_inmuebles_records r using qa_lead_cleanup t where (r.collection,r.id)=(t.collection,t.id);
delete from public.fortius_inmuebles_record_revisions r using qa_lead_cleanup t where (r.collection,r.id)=(t.collection,t.id);
delete from public.fortius_inmuebles_staff where user_id in (${list(users)});
commit;
select count(*) as remaining_test_records from public.fortius_inmuebles_records where ${predicates} or (collection='clientes' and data->>'leadId' in (${list(leadIds)}));
`;
  await writeFile(".qa-comercial/cleanup-live-lead.sql", sql); await manifest();
  try {
    execFileSync("C:/Users/Moise/AppData/Local/npm-cache/_npx/c34c3565ecb5471d/node_modules/@supabase/cli-windows-x64/bin/supabase.exe", ["db", "query", "--linked", "--project-ref", "qkkirjzhviqwvuqjnmei", "--file", ".qa-comercial/cleanup-live-lead.sql"], { stdio: "pipe", timeout: 60000, windowsHide: true });
    for (const id of users) {
      const user = await server.auth.admin.getUserById(id); assert.ifError(user.error); assert.ok(user.data.user.email.startsWith(`fortius-inmuebles-qa-lead-${run}-`));
      assert.ifError((await server.auth.admin.deleteUser(id)).error);
    }
    console.log("PASS test conversions, records, memberships and three Auth accounts removed");
  } catch (error) { cleanupFailed = error; console.error(`Cleanup failed: ${error.message}`); }
}
if (failed || cleanupFailed) process.exitCode = 1;
