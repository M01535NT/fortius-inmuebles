/**
 * Explicit integration check, never included in the offline test suite.
 * Run against the NEW dedicated project only:
 * node --env-file=.env.local tests/live/verify-fortius-inmuebles.mjs --run
 * Creates its own two test users/records; never sends email or touches existing rows.
 */
import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

assert.equal(process.argv[2], "--run", "Live mutation requires explicit --run");
const projectRef = process.env.FORTIUS_INMUEBLES_TEST_PROJECT_REF || "qkkirjzhviqwvuqjnmei";
assert.match(projectRef, /^[a-z]{20}$/, "Invalid dedicated Supabase project ref");
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
  `${projectRef}.supabase.co`, "Refusing any other Supabase project");
const origin = process.env.FORTIUS_INMUEBLES_TEST_URL;
assert.ok(origin, "FORTIUS_INMUEBLES_TEST_URL is required");
assert.equal(new URL(origin).origin, origin, "FORTIUS_INMUEBLES_TEST_URL must be an origin without a path");
const verifyWeb = process.argv.includes("--web");
const verifyRevisions = process.argv.includes("--revisions");
if (verifyRevisions) assert.ok(process.argv.includes("--migration-002-applied"),
  "Revision mutation requires explicit confirmation that reviewed migration002 is applied");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(key, "Server-only key is required");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
const runId = randomUUID();
const prefix = `verification-${runId}`;
const users = [];
const records = [];
const objects = [];
const results = [];
let memberUserId;

function session() {
  const cookies = new Map();
  const request = async (path, { method = "GET", data, body } = {}) => {
    const headers = new Headers({ Origin: origin });
    if (cookies.size) headers.set("Cookie", [...cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    if (data !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(origin + path, {
      method, headers, body: data === undefined ? body : JSON.stringify(data), redirect: "manual",
    });
    const setCookies = response.headers.getSetCookie();
    for (const value of setCookies) {
      const pair = value.split(";", 1)[0];
      const index = pair.indexOf("=");
      if (index < 0) continue;
      const name = pair.slice(0, index);
      if (/max-age=0/i.test(value) || pair.slice(index + 1) === "") cookies.delete(name);
      else cookies.set(name, pair.slice(index + 1));
    }
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { error: "Non-JSON response" }; }
    return { status: response.status, data: result, setCookies };
  };
  request.deleteCookie = (name) => cookies.delete(name);
  request.setCookie = (name, value) => cookies.set(name, value);
  return request;
}

async function check(name, action) {
  await action();
  results.push(name);
  console.log(`PASS ${name}`);
}

async function createUser(suffix, member) {
  const email = `fortius-inmuebles-${runId}-${suffix}@example.invalid`;
  const password = randomBytes(32).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  users.push(data.user.id);
  if (member) {
    memberUserId = data.user.id;
    const { error: grantError } = await admin.from("fortius_inmuebles_staff")
      .insert({ user_id: data.user.id, role: "admin", active: true });
    assert.ifError(grantError);
  }
  return { email, password };
}

const collectionPath = (collection, id) => `/api/admin/collections/${collection}/${id}`;
let failure;
let cleanupFailed = false;
try {
  const first = session();
  const second = session();
  const outsider = session();
  await check("anonymous cannot read the panel", async () => {
    assert.equal((await first("/api/auth/session")).status, 401);
    assert.equal((await first("/api/admin/collections/clientes")).status, 401);
    const { error } = await anon.from("fortius_inmuebles_records").select("id").limit(1);
    assert.ok(error, "Anonymous direct reads must be denied, not merely hidden by the UI");
  });

  const member = await createUser("member", true);
  const nonmember = await createUser("nonmember", false);
  await check("authenticated nonmember is denied", async () => {
    assert.equal((await outsider("/api/auth/login", { method: "POST", data: nonmember })).status, 403);
    assert.notEqual((await outsider("/api/admin/collections/clientes")).status, 200);
  });
  await check("two real sessions use HttpOnly cookies", async () => {
    assert.equal((await first("/api/auth/login", {
      method: "POST", data: { email: member.email, password: "wrong-verification-password" },
    })).status, 401);
    const response = await first("/api/auth/login", { method: "POST", data: member });
    assert.equal(response.status, 200);
    assert.ok(response.setCookies.length > 0);
    assert.ok(response.setCookies.every((value) => /httponly/i.test(value)));
    assert.equal((await second("/api/auth/login", { method: "POST", data: member })).status, 200);
    assert.equal((await first("/api/auth/session")).data.user.email, member.email);
  });
  await check("missing access token refreshes and invalid session cookies are rejected", async () => {
    first.deleteCookie("fortius-inmuebles-access-token");
    const refreshed = await first("/api/auth/session");
    assert.equal(refreshed.status, 200);
    assert.equal(refreshed.data.user.email, member.email);
    assert.ok(refreshed.setCookies.some((value) => value.startsWith("fortius-inmuebles-access-token=")));

    const invalid = session();
    invalid.setCookie("fortius-inmuebles-access-token", "expired-verification-token");
    invalid.setCookie("fortius-inmuebles-refresh-token", "expired-verification-refresh");
    const rejected = await invalid("/api/auth/session");
    assert.equal(rejected.status, 401);
    assert.ok(rejected.setCookies.some((value) => /fortius-inmuebles-(access|refresh)-token=.*max-age=0/i.test(value)));
  });

  await check("an editor member retains panel access", async () => {
    const { error: editorError } = await admin.from("fortius_inmuebles_staff")
      .update({ role: "editor" }).eq("user_id", memberUserId);
    assert.ifError(editorError);
    const editorSession = await first("/api/auth/session");
    assert.equal(editorSession.status, 200);
    assert.equal(editorSession.data.user.role, "editor");
    assert.equal((await first("/api/admin/collections/notas")).status, 200);
    const { error: restoreError } = await admin.from("fortius_inmuebles_staff")
      .update({ role: "admin" }).eq("user_id", memberUserId);
    assert.ifError(restoreError);
  });

  const clientId = `${prefix}-client`;
  const now = new Date().toISOString();
  const client = { id: clientId, nombre: "PRUEBA TECNICA MNT", telefono: "0000000000",
    tipo: "otro", notas: "Temporary verification fixture", creadoEl: now, actualizadoEl: now };
  let clientVersion;
  await check("client survives reload and is shared by two sessions", async () => {
    records.push({ collection: "clientes", id: clientId });
    const response = await first(collectionPath("clientes", clientId), {
      method: "PUT", data: { data: client, version: null },
    });
    assert.equal(response.status, 200);
    clientVersion = response.data.record.version;
    const list = await second("/api/admin/collections/clientes");
    assert.equal(list.status, 200);
    assert.equal(list.data.records.find((r) => r.id === clientId).data.nombre, client.nombre);
  });
  await check("stale edits return 409 without overwriting", async () => {
    const changed = { ...client, notas: "Confirmed first editor" };
    assert.equal((await first(collectionPath("clientes", clientId), {
      method: "PUT", data: { data: changed, version: clientVersion },
    })).status, 200);
    assert.equal((await second(collectionPath("clientes", clientId), {
      method: "PUT", data: { data: { ...client, notas: "Stale editor" }, version: clientVersion },
    })).status, 409);
    const list = await second("/api/admin/collections/clientes");
    assert.equal(list.data.records.find((r) => r.id === clientId).data.notas, "Confirmed first editor");
  });

  const propertyId = `${prefix}-property`;
  const property = { slug: propertyId, codigo: "PRUEBA-MNT", titulo: "PRUEBA TECNICA MNT",
    tipo: "casa", operacion: "venta", precio: { modalidad: "consulta" }, zona: "",
    direccionAproximada: "", descripcion: [], ficha: {}, amenidades: [],
    galeria: [{ src: "/hero/casa-playa.webp", alt: "Public verification fixture" }],
    asesorId: "", creditoDisponible: false, puntosDeInteres: [], destacada: false,
    estado: "disponible", publicadaEl: now, demo: true, publicada: false,
    privateVerificationMarker: "MUST-NOT-BE-PUBLIC" };
  let propertyVersion;
  if (verifyRevisions) await check("migration002 preserves revisions across recreation, concurrent writes and direct RPC", async () => {
    const id = `${prefix}-aba`;
    records.push({ collection: "propiedades", id });
    const fixture = { ...property, slug: id, titulo: "ABA current fixture" };
    const path = collectionPath("propiedades", id);
    const creates = await Promise.all([first(path, { method: "PUT", data: { data: fixture, version: null } }), second(path, { method: "PUT", data: { data: fixture, version: null } })]);
    assert.deepEqual(creates.map((result) => result.status).sort(), [200, 409]);
    const opening = creates.find((result) => result.status === 200).data.record;
    const updates = await Promise.all([first(path, { method: "PUT", data: { data: { ...fixture, titulo: "Writer A" }, version: opening.version } }), second(path, { method: "PUT", data: { data: { ...fixture, titulo: "Writer B" }, version: opening.version } })]);
    assert.deepEqual(updates.map((result) => result.status).sort(), [200, 409]);
    const latest = updates.find((result) => result.status === 200).data.record;
    assert.equal((await first(path, { method: "DELETE", data: { version: latest.version } })).status, 200);
    const recreated = await second(path, { method: "PUT", data: { data: fixture, version: null } });
    assert.equal(recreated.status, 200);
    assert.ok(recreated.data.record.version > latest.version);
    for (const version of [opening.version, latest.version]) {
      assert.equal((await first(path, { method: "PUT", data: { data: opening.data, version } })).status, 409);
      assert.equal((await first(path, { method: "DELETE", data: { version } })).status, 409);
    }
    const direct = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    assert.ifError((await direct.auth.signInWithPassword(member)).error);
    try {
      const put = await direct.rpc("fortius_inmuebles_put_record", { p_collection: "propiedades", p_id: id, p_data: opening.data, p_version: opening.version });
      assert.equal(put.error?.code, "PT409");
      const del = await direct.rpc("fortius_inmuebles_delete_record", { p_collection: "propiedades", p_id: id, p_version: opening.version });
      assert.equal(del.error?.code, "PT409");
      const list = await first("/api/admin/collections/propiedades");
      assert.equal(list.data.records.find((record) => record.id === id).data.titulo, fixture.titulo);
    } finally { await direct.auth.signOut({ scope: "local" }); }
    const valid = await second(path, { method: "PUT", data: { data: { ...fixture, titulo: "Valid recreated editor" }, version: recreated.data.record.version } });
    assert.equal(valid.status, 200);
    assert.equal(valid.data.record.data.titulo, "Valid recreated editor");
    assert.equal((await second(path, { method: "DELETE", data: { version: valid.data.record.version } })).status, 200);
    // Keep the numeric tombstone; final cleanup removes only remaining fixture content.
  });
  await check("unpublished property is absent from public data", async () => {
    records.push({ collection: "propiedades", id: propertyId });
    const response = await first(collectionPath("propiedades", propertyId), {
      method: "PUT", data: { data: property, version: null },
    });
    assert.equal(response.status, 200);
    propertyVersion = response.data.record.version;
    const { data, error } = await anon.rpc("fortius_inmuebles_public_records", { p_collection: "propiedades" });
    assert.ifError(error);
    assert.ok(!data.some((r) => r.data.slug === propertyId));
  });
  await check("publication exposes safe fields only", async () => {
    const response = await first(collectionPath("propiedades", propertyId), {
      method: "PUT", data: { data: { ...property, publicada: true }, version: propertyVersion },
    });
    assert.equal(response.status, 200);
    propertyVersion = response.data.record.version;
    const { data, error } = await anon.rpc("fortius_inmuebles_public_records", { p_collection: "propiedades" });
    assert.ifError(error);
    const visible = data.find((r) => r.data.slug === propertyId)?.data;
    assert.equal(visible?.titulo, property.titulo);
    assert.ok(!("privateVerificationMarker" in visible));
    const hidden = await first(collectionPath("propiedades", propertyId), {
      method: "PUT", data: { data: property, version: propertyVersion },
    });
    assert.equal(hidden.status, 200);
    propertyVersion = hidden.data.record.version;
    const again = await anon.rpc("fortius_inmuebles_public_records", { p_collection: "propiedades" });
    assert.ifError(again.error);
    assert.ok(!again.data.some((r) => r.data.slug === propertyId));
  });
  if (verifyWeb) await check("public routes and sitemap follow publication without rebuilding", async () => {
    const detailPath = `${origin}/inventario/${propertyId}`;
    assert.equal((await fetch(detailPath)).status, 404);
    const published = await first(collectionPath("propiedades", propertyId), {
      method: "PUT", data: { data: { ...property, publicada: true, demo: false }, version: propertyVersion },
    });
    assert.equal(published.status, 200);
    propertyVersion = published.data.record.version;
    const detail = await fetch(detailPath);
    assert.equal(detail.status, 200);
    assert.ok((await detail.text()).includes(property.titulo));
    const inventory = await fetch(origin + "/inventario");
    assert.equal(inventory.status, 200);
    assert.ok((await inventory.text()).includes(propertyId));
    const sitemap = await fetch(origin + "/sitemap.xml");
    assert.equal(sitemap.status, 200);
    assert.ok((await sitemap.text()).includes(propertyId));
    const unpublished = await first(collectionPath("propiedades", propertyId), {
      method: "PUT", data: { data: property, version: propertyVersion },
    });
    assert.equal(unpublished.status, 200);
    propertyVersion = unpublished.data.record.version;
    assert.equal((await fetch(detailPath)).status, 404);
    assert.ok(!(await (await fetch(origin + "/sitemap.xml")).text()).includes(propertyId));
    const home = await fetch(origin);
    assert.equal(home.status, 200);
    assert.ok(!(await home.text()).includes("inmobiliaria-os.vercel.app"));
  });

  if (verifyWeb) await check("blog lifecycle follows publication, safe rendering and immutable unique slugs", async () => {
    const postId = `${prefix}-web-post`;
    const duplicateId = `${prefix}-web-post-duplicate`;
    const slug = `${prefix}-web-post`;
    const changedSlug = `${slug}-changed`;
    const unsafeBody = "Primer párrafo\n\n<script>alert('fortius-inmuebles-live')</script>";
    const post = {
      id: postId, slug, titulo: "ARTÍCULO WEB DE PRUEBA", resumen: "Resumen temporal",
      contenido: unsafeBody, estado: "borrador", actualizadoEl: now,
    };
    records.push({ collection: "posts", id: postId });
    const path = collectionPath("posts", postId);
    const detailUrl = `${origin}/blog/${slug}`;
    const created = await first(path, { method: "PUT", data: { data: post, version: null } });
    assert.equal(created.status, 200);
    assert.equal((await fetch(detailUrl)).status, 404);
    assert.ok(!(await (await fetch(origin + "/sitemap.xml")).text()).includes(`/blog/${slug}`));

    const published = await first(path, {
      method: "PUT", data: { data: { ...post, estado: "publicado" }, version: created.data.record.version },
    });
    assert.equal(published.status, 200);
    const publicDetail = await fetch(detailUrl);
    assert.equal(publicDetail.status, 200);
    const publicHtml = await publicDetail.text();
    assert.ok(publicHtml.includes(post.titulo));
    assert.ok(publicHtml.includes("&lt;script&gt;alert"), "Stored markup must render as escaped text");
    assert.ok(!publicHtml.includes("<script>alert('fortius-inmuebles-live')</script>"), "Stored markup must never become executable HTML");
    assert.ok(publicHtml.includes(`rel="canonical" href="${detailUrl}"`));
    assert.ok((await (await fetch(origin + "/sitemap.xml")).text()).includes(`/blog/${slug}`));

    records.push({ collection: "posts", id: duplicateId });
    const duplicate = await second(collectionPath("posts", duplicateId), {
      method: "PUT", data: { data: { ...post, id: duplicateId }, version: null },
    });
    assert.equal(duplicate.status, 409);

    const changedBody = "Contenido actualizado desde la segunda sesión.";
    const edited = await second(path, {
      method: "PUT", data: { data: { ...post, estado: "publicado", contenido: changedBody }, version: published.data.record.version },
    });
    assert.equal(edited.status, 200);
    assert.equal(edited.data.record.data.slug, slug);
    const editedHtml = await (await fetch(detailUrl)).text();
    assert.ok(editedHtml.includes(changedBody));
    assert.ok(!editedHtml.includes("Primer párrafo"));

    const renamed = await first(path, {
      method: "PUT", data: { data: { ...edited.data.record.data, slug: changedSlug }, version: edited.data.record.version },
    });
    assert.equal(renamed.status, 400);
    assert.equal((await fetch(`${origin}/blog/${changedSlug}`)).status, 404);

    const withdrawn = await first(path, {
      method: "PUT", data: { data: { ...edited.data.record.data, estado: "borrador" }, version: edited.data.record.version },
    });
    assert.equal(withdrawn.status, 200);
    assert.equal((await fetch(detailUrl)).status, 404);
    assert.ok(!(await (await fetch(origin + "/sitemap.xml")).text()).includes(`/blog/${slug}`));
  });

  if (process.env.FORTIUS_INMUEBLES_TEST_PRODUCTION_LEADS === "true") await check("all five public lead variants acknowledge actual persistence", async () => {
    const variants = ["evaluar", "contacto", "checklist", "documentos", "interes-propiedad"];
    const ids = [];
    for (const origen of variants) {
      const response = await session()("/api/leads", { method: "POST", data: {
        nombre: "PRUEBA TECNICA MNT", telefono: "0000000000", origen, mensaje: prefix,
        ...(origen === "interes-propiedad" ? { propiedadSlug: propertyId } : {}),
      } });
      assert.equal(response.status, 201, `${origen}: acknowledgement`);
      assert.equal(typeof response.data.id, "string");
      ids.push(response.data.id);
      records.push({ collection: "leads", id: response.data.id });
    }
    const list = await first("/api/admin/collections/leads");
    for (const [index, id] of ids.entries()) {
      const savedVariant = list.data.records.find((r) => r.id === id);
      assert.equal(savedVariant.data.origen, variants[index]);
      assert.equal(savedVariant.data.mensaje, prefix);
    }
    const saved = list.data.records.find((r) => r.id === ids[0]);
    const changed = { ...saved.data, estado: "contactado", notas: [{ id: `${prefix}-lead-note`, texto: "Seguimiento de prueba", fecha: now }] };
    const updated = await first(collectionPath("leads", saved.id), { method: "PUT", data: { data: changed, version: saved.version } });
    assert.equal(updated.status, 200);
    const reloaded = await second("/api/admin/collections/leads");
    assert.deepEqual(reloaded.data.records.find((r) => r.id === saved.id).data, changed);
    const denied = await anon.rpc("fortius_inmuebles_public_records", { p_collection: "leads" });
    assert.ok(denied.error || denied.data.length === 0);
  });

  await check("advisers, calendar, notes, blog and library preserve acknowledged CRUD", async () => {
    const cases = [
      ["asesores", { id: `${prefix}-adviser`, nombre: "ASESOR DE PRUEBA", cargo: "Verificación", iniciales: "VP", activo: false, email: "private@example.invalid", telefono: "0000000000" }, "nombre"],
      ["eventos", { id: `${prefix}-event`, titulo: "EVENTO DE PRUEBA", fecha: now.slice(0, 10), hora: "12:30", tipo: "otro", propiedadSlug: propertyId, notas: "Verificación" }, "titulo"],
      ["notas", { id: `${prefix}-note`, titulo: "NOTA DE PRUEBA", texto: "Texto inicial", actualizadoEl: now }, "texto"],
      ["posts", { id: `${prefix}-post`, slug: `${prefix}-post`, titulo: "ARTICULO DE PRUEBA", resumen: "Resumen", contenido: "Contenido inicial", estado: "borrador", actualizadoEl: now }, "contenido"],
      ["archivos", { id: `${prefix}-file`, nombre: "REFERENCIA DE PRUEBA", url: "/hero/casa-playa.webp", tipo: "imagen", notas: "Referencia temporal, sin copiar el activo" }, "notas"],
    ];
    for (const [collection, original, field] of cases) {
      records.push({ collection, id: original.id });
      const path = collectionPath(collection, original.id);
      const created = await first(path, { method: "PUT", data: { data: original, version: null } });
      assert.equal(created.status, 200, `${collection}: create`);
      const loaded = await second(`/api/admin/collections/${collection}`);
      assert.equal(loaded.status, 200);
      assert.deepEqual(loaded.data.records.find((row) => row.id === original.id).data, original);
      if (collection === "eventos") {
        const blockedDelete = await first(collectionPath("propiedades", propertyId), { method: "DELETE", data: { version: propertyVersion } });
        assert.equal(blockedDelete.status, 409, "Referenced property cannot be silently deleted");
      }
      if (collection === "archivos") {
        assert.equal((await first(path, { method: "DELETE", data: { version: created.data.record.version } })).status, 409, "Shared asset reference must remain protected");
      }
      const changed = { ...original, [field]: "Cambio confirmado en segunda sesión",
        ...(collection === "archivos" ? { url: `${original.url}#${prefix}` } : {}) };
      const updated = await first(path, { method: "PUT", data: { data: changed, version: created.data.record.version } });
      assert.equal(updated.status, 200, `${collection}: update`);
      const reloaded = await second(`/api/admin/collections/${collection}`);
      assert.deepEqual(reloaded.data.records.find((row) => row.id === original.id).data, changed);
      const hidden = await anon.rpc("fortius_inmuebles_public_records", { p_collection: collection });
      assert.ok(hidden.error || !hidden.data.some((row) => row.data.id === original.id), `${collection}: private/inactive/draft row leaked`);
      assert.equal((await first(path, { method: "DELETE", data: { version: created.data.record.version } })).status, 409);
      assert.equal((await first(path, { method: "DELETE", data: { version: updated.data.record.version } })).status, 200, `${collection}: unreferenced current-version delete`);
      const removed = await second(`/api/admin/collections/${collection}`);
      assert.ok(!removed.data.records.some((row) => row.id === original.id), `${collection}: delete did not persist`);
    }
  });

  await check("private upload is anonymous-inaccessible and resolves for staff", async () => {
    const bytes = await readFile(new URL("../../public/hero/casa-playa.webp", import.meta.url));
    const form = new FormData();
    form.set("file", new File([bytes], `${prefix}.webp`, { type: "image/webp" }));
    form.set("visibility", "private");
    const response = await first("/api/admin/files", { method: "POST", body: form });
    if (response.data.bucket === "fortius-inmuebles-private" && response.data.path?.startsWith(memberUserId + "/")) {
      objects.push({ bucket: response.data.bucket, path: response.data.path });
    }
    assert.equal(response.status, 201);
    assert.equal(response.data.bucket, "fortius-inmuebles-private");
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fortius-inmuebles-private/${response.data.path}`;
    assert.ok(!(await fetch(publicUrl)).ok, "Private file must not be publicly retrievable");
    const signed = await first(`/api/admin/files?bucket=fortius-inmuebles-private&path=${encodeURIComponent(response.data.path)}`);
    assert.equal(signed.status, 200);
    const download = await fetch(signed.data.url);
    assert.equal(download.status, 200);
    assert.equal(createHash("sha256").update(Buffer.from(await download.arrayBuffer())).digest("hex"),
      createHash("sha256").update(bytes).digest("hex"));
    const forgedExpiredUrl = new URL(signed.data.url);
    const forgedHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const forgedPayload = Buffer.from(JSON.stringify({ exp: 1, sub: response.data.path })).toString("base64url");
    forgedExpiredUrl.searchParams.set("token", `${forgedHeader}.${forgedPayload}.forged`);
    assert.ok(!(await fetch(forgedExpiredUrl)).ok, "A forged expired private link must be denied");
  });
  await check("public upload is retrievable while invalid and oversized files are rejected", async () => {
    const bytes = await readFile(new URL("../../public/hero/casa-playa.webp", import.meta.url));
    const publicForm = new FormData();
    publicForm.set("file", new File([bytes], `${prefix}-public.webp`, { type: "image/webp" }));
    publicForm.set("visibility", "public");
    const saved = await first("/api/admin/files", { method: "POST", body: publicForm });
    if (saved.data.bucket === "fortius-inmuebles-public" && saved.data.path?.startsWith(memberUserId + "/")) {
      objects.push({ bucket: saved.data.bucket, path: saved.data.path });
    }
    assert.equal(saved.status, 201);
    assert.equal(saved.data.bucket, "fortius-inmuebles-public");
    const publicDownload = await fetch(saved.data.url);
    assert.equal(publicDownload.status, 200);
    assert.equal(createHash("sha256").update(Buffer.from(await publicDownload.arrayBuffer())).digest("hex"),
      createHash("sha256").update(bytes).digest("hex"));

    const invalidForm = new FormData();
    invalidForm.set("file", new File([Buffer.from("not a real png")], `${prefix}.png`, { type: "image/png" }));
    invalidForm.set("visibility", "private");
    assert.equal((await first("/api/admin/files", { method: "POST", body: invalidForm })).status, 400);

    const oversized = await first("/api/admin/files/upload", { method: "POST", data: {
      name: `${prefix}-oversized.webp`, size: 20 * 1024 * 1024 + 1,
      contentType: "image/webp", visibility: "private",
    } });
    assert.equal(oversized.status, 400);
  });
  await check("interrupted staging and forged expired tickets cannot finalize", async () => {
    const size = 1024;
    const prepared = await first("/api/admin/files/upload", { method: "POST", data: {
      name: `${prefix}-interrupted.webp`, size, contentType: "image/webp", visibility: "private",
    } });
    assert.equal(prepared.status, 200);
    assert.ok(prepared.data.path.startsWith(memberUserId + "/"));
    objects.push({ bucket: "fortius-inmuebles-staging", path: prepared.data.path });
    assert.equal((await first("/api/admin/files/complete", {
      method: "POST", data: { ticket: prepared.data.ticket },
    })).status, 409);

    const expiredPath = `${memberUserId}/${randomUUID()}.webp`;
    const payload = Buffer.from(JSON.stringify({
      name: `${prefix}-expired.webp`, size, contentType: "image/webp", visibility: "private",
      // An epoch timestamp avoids false failures from client/server clock skew.
      v: 1, uid: memberUserId, path: expiredPath, expires: 1,
    })).toString("base64url");
    // Match the server's HMAC without ever printing the service-role secret or ticket.
    const expiredTicket = `${payload}.${createHmac("sha256", key).update(`fortius-inmuebles-upload-v1:${payload}`).digest("base64url")}`;
    assert.equal((await first("/api/admin/files/complete", {
      method: "POST", data: { ticket: expiredTicket },
    })).status, 403);
  });
  await check("large upload sends bytes directly to private staging", async () => {
    const source = await readFile(new URL("../../public/hero/casa-playa.webp", import.meta.url));
    const bytes = Buffer.concat([source, Buffer.alloc(5 * 1024 * 1024)]);
    const prepared = await first("/api/admin/files/upload", { method: "POST", data: {
      name: `${prefix}-large.webp`, size: bytes.length, contentType: "image/webp", visibility: "private",
    } });
    assert.ok(prepared.status >= 200 && prepared.status < 300);
    assert.equal(new URL(prepared.data.signedUrl).hostname, `${projectRef}.supabase.co`);
    assert.ok(prepared.data.path.startsWith(memberUserId + "/"));
    objects.push({ bucket: "fortius-inmuebles-staging", path: prepared.data.path });
    const uploaded = await fetch(prepared.data.signedUrl, {
      method: "PUT", headers: { "Content-Type": "image/webp" }, body: bytes,
    });
    assert.ok(uploaded.ok, `Direct upload HTTP ${uploaded.status}`);
    const completed = await first("/api/admin/files/complete", {
      method: "POST", data: { ticket: prepared.data.ticket },
    });
    if (completed.data.bucket === "fortius-inmuebles-private" && completed.data.path?.startsWith(memberUserId + "/")) {
      objects.push({ bucket: completed.data.bucket, path: completed.data.path });
    }
    assert.ok(completed.status >= 200 && completed.status < 300);
    assert.equal(completed.data.bucket, "fortius-inmuebles-private");
    const resolved = await first(completed.data.url);
    assert.equal(resolved.status, 200);
    const download = await fetch(resolved.data.url);
    assert.ok(download.ok);
    assert.equal(createHash("sha256").update(Buffer.from(await download.arrayBuffer())).digest("hex"),
      createHash("sha256").update(bytes).digest("hex"));
  });
  await check("logout denies subsequent panel access", async () => {
    assert.equal((await first("/api/auth/logout", { method: "POST" })).status, 200);
    assert.equal((await first("/api/auth/session")).status, 401);
    assert.equal((await first("/api/admin/collections/clientes")).status, 401);
  });
  await check("recovery callback and password setup work without browser token storage", async () => {
    // Generates a one-use link for our own fixture only; no email is sent.
    const link = await admin.auth.admin.generateLink({ type: "recovery", email: member.email });
    assert.ifError(link.error);
    assert.ok(link.data.properties.hashed_token);
    const recovered = session();
    const callback = await recovered("/api/auth/callback", { method: "POST", data: {
      type: "recovery", token_hash: link.data.properties.hashed_token,
    } });
    assert.equal(callback.status, 200);
    assert.ok(callback.setCookies.length > 0);
    assert.ok(callback.setCookies.every((value) => /httponly/i.test(value)));
    const password = randomBytes(32).toString("base64url");
    assert.equal((await recovered("/api/auth/password", {
      method: "POST", data: { password },
    })).status, 200);
    const newLogin = session();
    assert.equal((await newLogin("/api/auth/login", {
      method: "POST", data: { email: member.email, password },
    })).status, 200);
    assert.equal((await newLogin("/api/auth/logout", { method: "POST" })).status, 200);
    assert.equal((await recovered("/api/auth/logout", { method: "POST" })).status, 200);
  });
} catch (error) {
  failure = error;
} finally {
  const cleanupErrors = [];
  const { data: testLeads, error: findLeadError } = await admin.from("fortius_inmuebles_records")
    .select("id").eq("collection", "leads").eq("data->>mensaje", prefix);
  if (findLeadError) cleanupErrors.push(`Finding test lead: ${findLeadError.message}`);
  for (const lead of testLeads ?? []) {
    if (!records.some((record) => record.collection === "leads" && record.id === lead.id)) records.push({ collection: "leads", id: lead.id });
  }
  for (const { collection, id } of records.reverse()) {
    const { error } = await admin.from("fortius_inmuebles_records").delete().eq("collection", collection).eq("id", id);
    if (error) cleanupErrors.push(`Record ${collection}/${id}: ${error.message}`);
  }
  for (const { bucket, path } of objects) {
    const { error } = await admin.storage.from(bucket).remove([path]);
    if (error) cleanupErrors.push(`Object ${bucket}/${path}: ${error.message}`);
  }
  for (const id of users) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) cleanupErrors.push(`User ${id}: ${error.message}`);
  }
  if (cleanupErrors.length) {
    cleanupFailed = true;
    console.error("CLEANUP INCOMPLETE", cleanupErrors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`CLEANUP OK: ${records.length} test records, ${objects.length} objects, ${users.length} users`);
  }
}
if (failure) {
  console.error("FAILED", failure.message);
  process.exitCode = 1;
} else if (!cleanupFailed) {
  console.log(`LIVE CHECKS PASSED: ${results.length}`);
}
