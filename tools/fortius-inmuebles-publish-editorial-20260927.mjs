import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const directory = new URL('../content/blog/2026-09-27/', import.meta.url);
const entries = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const canonical = (v) => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
const digest = (v) => createHash('sha256').update(JSON.stringify(canonical(v)) ?? 'undefined').digest('hex');
const targets = await Promise.all(entries.map(async ({ file, previous, ...metadata }) => ({
  post: { ...metadata, autor: 'Redacción Fortius Inmuebles', contenido: (await readFile(new URL(file, directory), 'utf8')).trim() },
  previous: previous ?? null,
})));
assert(targets.length === 6 && new Set(targets.map(x => x.post.slug)).size === 6, 'Expected six unique topics');
const expectedPrevious = new Set(['mnt-news-20260923-01', 'mnt-news-20260924-02']);
const sourceHosts = new Set(['www.gob.mx', 'www.bajacalifornia.gob.mx', 'www.tijuana.gob.mx', 'apps.tijuana.gob.mx', 'fovissste.gob.mx', 'retys.bajacalifornia.gob.mx', 'www.diputados.gob.mx', 'www.sat.gob.mx']);
for (const { post, previous } of targets) {
  assert(Boolean(previous) === expectedPrevious.has(post.id), 'Unexpected update target');
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug), 'Invalid slug');
  assert(post.titulo.length <= 160 && post.resumen.length >= 100 && post.resumen.length <= 180, 'Invalid title/summary');
  assert(post.contenido.includes('## Fuentes y revisión') && post.contenido.includes('27 de septiembre de 2026'), 'Missing source review');
  assert(!/<[^>]+>/.test(post.contenido), 'Unexpected HTML');
  const links = [...post.contenido.matchAll(/\]\(([^()\n]+)\)/g)].map(m => m[1]);
  assert(links.includes(post.fuenteUrl), 'Missing principal source');
  for (const link of links) {
    assert(!/[\s\\]/.test(link), 'Unsafe link');
    if (!link.startsWith('/blog/')) assert(new URL(link).protocol === 'https:' && sourceHosts.has(new URL(link).hostname), 'Unexpected source host');
  }
}
const summary = targets.map(({ post, previous }) => ({ slug: post.slug, operation: previous ? 'update' : 'insert', words: post.contenido.split(/\s+/).length, sha256: digest(post) }));
console.log(JSON.stringify({ localValidation: 'passed', articles: summary }, null, 2));
const publish = process.argv.includes('--publish');
if (!publish && !process.argv.includes('--check-remote')) process.exit(0);
assert(process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://qkkirjzhviqwvuqjnmei.supabase.co', 'Unexpected project');
assert(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Missing credentials');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
async function inventory() {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('fortius_inmuebles_records').select('id,data,version,created_at,updated_at').eq('collection', 'posts').order('id').range(offset, offset + 499);
    if (error) throw new Error(`Inventory failed: ${error.code ?? error.message}`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
const matches = (row, post) => row && row.data.estado === 'publicado' && Object.entries(post).every(([k, v]) => digest(row.data[k]) === digest(v));
const before = await inventory();
const pending = [];
for (const target of targets) {
  const { post, previous } = target;
  const row = before.find(r => r.id === post.id);
  assert(!before.some(r => r.data.slug === post.slug && r.id !== post.id), 'Slug collision');
  if (matches(row, post)) continue;
  if (previous) {
    assert(row && row.data.estado === 'publicado' && row.data.slug === post.slug && digest(row.data.contenido) === previous.contenidoSha256 && row.data.titulo === previous.titulo, `Previous content changed: ${post.id}`);
  } else assert(!row, `Unexpected existing record: ${post.id}`);
  const data = { ...(row?.data ?? {}), ...post, estado: 'publicado', actualizadoEl: new Date().toISOString() };
  const validation = await client.rpc('fortius_inmuebles_validate_record', { c: 'posts', record_id: post.id, d: data });
  assert(!validation.error, `Validation failed: ${post.id} ${validation.error?.code ?? ''} ${validation.error?.message ?? ''}`);
  pending.push({ ...target, row, data });
}
const slugs = new Set([...before.filter(r => r.data.estado === 'publicado').map(r => r.data.slug), ...targets.map(t => t.post.slug)]);
for (const { post } of targets) for (const m of post.contenido.matchAll(/\]\(\/blog\/([^()]+)\)/g)) assert(slugs.has(m[1]), `Missing related page: ${m[1]}`);
console.log(JSON.stringify({ remoteValidation: 'passed', pending: pending.length, insert: pending.filter(t => !t.row).length, update: pending.filter(t => t.row).length, existing: before.length }));
if (!publish) process.exit(0);
const timestamp = new Date().toISOString();
const evidence = new URL(`../.superpowers/editorial-20260927/publication-${timestamp.replace(/[:.]/g, '-')}/`, import.meta.url);
await mkdir(evidence, { recursive: true });
await writeFile(new URL('before.json', evidence), JSON.stringify(before, null, 2));
await writeFile(new URL('manifest.json', evidence), JSON.stringify(summary, null, 2));
// Updates use the observed version and never replace unknown fields or first publication.
for (const target of pending.filter(t => t.row)) {
  const { data, error } = await client.from('fortius_inmuebles_records').update({ data: target.data, version: target.row.version + 1, updated_at: timestamp }).eq('collection', 'posts').eq('id', target.post.id).eq('version', target.row.version).select('id');
  assert(!error && data?.length === 1, `Concurrent change or failed update: ${target.post.id}`);
}
const additions = pending.filter(t => !t.row).map(t => ({ collection: 'posts', id: t.post.id, data: t.data }));
if (additions.length) {
  const { error } = await client.from('fortius_inmuebles_records').insert(additions);
  assert(!error, `Insert failed: ${error?.code ?? ''}; inspect state before retrying`);
}
const after = await inventory();
await writeFile(new URL('after.json', evidence), JSON.stringify(after, null, 2));
assert(after.length === before.length + additions.length, 'Unexpected article count');
for (const { post } of targets) assert(matches(after.find(r => r.id === post.id), post), `Persisted mismatch: ${post.id}`);
for (const old of before) {
  const current = after.find(r => r.id === old.id);
  if (!targets.some(t => t.post.id === old.id)) assert(digest(old) === digest(current), 'Unrelated article changed');
  else assert(current.data.publicadoEl === old.data.publicadoEl, 'First publication changed');
}
const { data: publicRows, error } = await anonymous.rpc('fortius_inmuebles_public_records', { p_collection: 'posts' });
assert(!error, 'Public read failed');
for (const { post } of targets) assert(matches(publicRows.find(r => r.data.id === post.id), post), `Public content mismatch: ${post.id}`);
console.log(JSON.stringify({ verified: 6, inserted: additions.length, updated: pending.filter(t => t.row).length, total: after.length, evidence: evidence.pathname }));
