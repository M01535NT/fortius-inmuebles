import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const directory = new URL('../content/blog/2026-10-03/', import.meta.url);
const entries = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
const posts = await Promise.all(entries.map(async ({ file, ...metadata }) => ({
  ...metadata, autor: 'Redacción Mint Inmuebles', ambito: 'Baja California',
  contenido: (await readFile(new URL(file, directory), 'utf8')).trim(),
})));
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => createHash('sha256').update(JSON.stringify(canonical(value)) ?? 'undefined').digest('hex');
const matches = (row, post) => row?.id === post.id && row.data.estado === 'publicado'
  && Object.entries(post).every(([key, value]) => digest(row.data[key]) === digest(value));
const allowedHosts = new Set(['www.congresobc.gob.mx', 'retys.bajacalifornia.gob.mx']);
assert.equal(posts.length, 5);
assert.equal(new Set(posts.map(post => post.id)).size, 5);
assert.equal(new Set(posts.map(post => post.slug)).size, 5);
const links = [];
for (const post of posts) {
  assert.match(post.id, /^mint-guide-20261003-0[1-5]$/);
  assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(post.titulo.length <= 160 && post.resumen.length >= 100 && post.resumen.length <= 180);
  assert(post.formato === 'guia' && ['vender', 'tramites'].includes(post.categoria));
  const words = post.contenido.split(/\s+/).length;
  assert(words >= 450 && words <= 900, `${post.slug}: body length ${words}`);
  assert(!/<[^>]+>|\]\s+\(/.test(post.contenido), 'Unexpected markup');
  assert(!/especialista correspondiente|base provisional|no constituye asesoría/i.test(post.contenido), 'Generic notice');
  for (const match of post.contenido.matchAll(/\]\(([^()\n]+)\)/g)) {
    const href = match[1];
    assert(!/[\s\\]/.test(href));
    if (href.startsWith('/')) assert(href === '/contacto' || href.startsWith('/blog/'));
    else assert(new URL(href).protocol === 'https:' && allowedHosts.has(new URL(href).hostname));
    links.push(href);
  }
  assert(post.contenido.includes('](/contacto)'), 'Missing contact link');
}
const manifest = posts.map(post => ({ id: post.id, slug: post.slug, words: post.contenido.split(/\s+/).length, sha256: digest(post) }));
console.log(JSON.stringify({ localValidation: 'passed', articles: manifest }));
const publish = process.argv.includes('--publish');
if (!publish && !process.argv.includes('--check-remote')) process.exit(0);
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://qkkirjzhviqwvuqjnmei.supabase.co', 'Unexpected project');
assert(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Missing credentials');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
async function inventory() {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('mnt_records').select('id,data,version,created_at,updated_at').eq('collection', 'posts').order('id').range(offset, offset + 499);
    assert(!error, `Inventory failed (${error?.code})`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
const before = await inventory();
const pending = [];
for (const post of posts) {
  assert(!before.some(row => row.data.slug === post.slug && row.id !== post.id), 'Slug collision');
  const row = before.find(row => row.id === post.id);
  if (row) { assert(matches(row, post), `Existing content differs: ${post.id}`); continue; }
  pending.push(post);
}
for (const href of links.filter(href => href.startsWith('/blog/'))) {
  assert(before.some(row => row.data.estado === 'publicado' && row.data.slug === href.slice(6)), `Related article unavailable: ${href}`);
}
const timestamp = new Date().toISOString();
const rows = pending.map(post => ({ collection: 'posts', id: post.id, data: { ...post, estado: 'publicado', actualizadoEl: timestamp } }));
for (const row of rows) {
  const { error } = await client.rpc('mnt_validate_record', { c: 'posts', record_id: row.id, d: row.data });
  assert(!error, `Validation failed: ${row.id} (${error?.code})`);
}
console.log(JSON.stringify({ remoteValidation: 'passed', existing: before.length, additions: rows.length, publish }));
if (!publish) process.exit(0);
const evidence = new URL(`../.superpowers/guides-20261003/publication-${timestamp.replace(/[:.]/g, '-')}/`, import.meta.url);
await mkdir(evidence, { recursive: true });
await writeFile(new URL('before.json', evidence), JSON.stringify(before, null, 2));
await writeFile(new URL('manifest.json', evidence), JSON.stringify(manifest, null, 2));
if (rows.length) {
  // One atomic addition: existing articles and their featured flags remain untouched.
  const { error } = await client.from('mnt_records').insert(rows);
  assert(!error, `Insert failed (${error?.code}); inspect remote state before retrying`);
}
const after = await inventory();
await writeFile(new URL('after.json', evidence), JSON.stringify(after, null, 2));
assert.equal(after.length, before.length + rows.length);
assert(before.every(old => after.some(row => row.id === old.id && digest(row) === digest(old))), 'Existing article changed');
for (const post of posts) {
  const row = after.find(row => row.id === post.id);
  assert(matches(row, post) && Number.isFinite(Date.parse(row.data.publicadoEl)), `Stored publication mismatch: ${post.id}`);
}
const { data: publicRows, error } = await anonymous.rpc('mnt_public_records', { p_collection: 'posts' });
assert(!error, `Public read failed (${error?.code})`);
for (const post of posts) assert(matches(publicRows.find(row => row.data.id === post.id), post), `Public content mismatch: ${post.id}`);
console.log(JSON.stringify({ published: rows.length, verified: posts.length, existingUnchanged: before.length, total: after.length, evidence: evidence.pathname }));
