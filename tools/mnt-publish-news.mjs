import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Reviewed September news batch. Local validation is the default; writes require --publish.
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const directory = new URL('../content/blog/2026-09-actualidad/', import.meta.url);
const files = (await readdir(directory)).filter((file) => /^\d{2}\.json$/.test(file)).sort();
const posts = await Promise.all(files.map(async (file) => JSON.parse(await readFile(new URL(file, directory), 'utf8'))));
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
const digest = (value) => createHash('sha256').update(JSON.stringify(canonical(value)) ?? 'undefined').digest('hex');
const matches = (post, row) => row?.id === post.id && row.data.estado === 'publicado'
  && Object.entries(post).every(([key, value]) => digest(row.data[key]) === digest(value));
const localGuides = await Promise.all((await readdir(new URL('../content/blog/2026-09/', import.meta.url)))
  .filter((file) => /^\d{2}\.json$/.test(file)).map(async (file) => JSON.parse(await readFile(new URL(`../content/blog/2026-09/${file}`, import.meta.url), 'utf8'))));
const guideSlugs = new Set(localGuides.map((post) => post.slug));
const sourceHosts = new Set(['www.gob.mx', 'www.inegi.org.mx', 'revista.condusef.gob.mx']);
assert(posts.length === 3 && new Set(posts.map((p) => p.id)).size === 3 && new Set(posts.map((p) => p.slug)).size === 3, 'Expected three unique articles');
for (const post of posts) {
  assert(/^mnt-news-20260923-0[1-3]$/.test(post.id) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug), 'Invalid identifier');
  assert(post.titulo.length > 0 && post.titulo.length <= 160 && post.resumen.length >= 100 && post.resumen.length <= 180, `${post.id}: invalid title/summary`);
  assert(post.formato === 'actualidad' && ['mercado', 'comprar'].includes(post.categoria) && typeof post.destacado === 'boolean', `${post.id}: invalid classification`);
  assert(post.autor === 'Redacción MNT Inmuebles' && post.ambito && post.fuenteNombre, `${post.id}: missing attribution`);
  const source = new URL(post.fuenteUrl);
  assert(source.protocol === 'https:' && sourceHosts.has(source.hostname), `${post.id}: unexpected source`);
  const words = post.contenido.trim().split(/\s+/).length;
  assert(words >= 150 && words <= 500 && !/<[^>]+>/.test(post.contenido), `${post.id}: invalid body`);
  assert(post.contenido.includes('## Fuente y revisión') && post.contenido.includes('23 de septiembre de 2026'), `${post.id}: missing review`);
  const links = [...post.contenido.matchAll(/\[([^\]\n]+)\]\(([^()\n]*)\)/g)].map((match) => match[2]);
  assert(links.includes(post.fuenteUrl) && links.some((link) => link.startsWith('/blog/')), `${post.id}: missing links`);
  for (const link of links) {
    assert(!/[\s\\]/.test(link), `${post.id}: unsafe link`);
    if (link.startsWith('/blog/')) assert(guideSlugs.has(link.slice(6)), `${post.id}: missing related guide`);
    else assert(new URL(link).protocol === 'https:' && sourceHosts.has(new URL(link).hostname), `${post.id}: unreviewed link`);
  }
}
const manifest = posts.map((post) => ({ id: post.id, slug: post.slug, sha256: digest(post) }));
console.log(JSON.stringify({ localValidation: 'passed', manifest }));
const publish = process.argv.includes('--publish');
if (!publish && !process.argv.includes('--check-remote')) process.exit(0);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert(url === 'https://qkkirjzhviqwvuqjnmei.supabase.co', 'Unexpected destination');
assert(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Missing credentials');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const anonymous = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const readPosts = async () => {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('mnt_records').select('id,data,version,created_at,updated_at').eq('collection', 'posts').order('id').range(offset, offset + 499);
    if (error) throw new Error(`Inventory failed (${error.code})`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
};
const verifyPublic = async () => {
  const { data, error } = await anonymous.rpc('mnt_public_records', { p_collection: 'posts' });
  if (error) throw new Error(`Public verification failed (${error.code})`);
  for (const post of posts) {
    const found = data.map((row) => row.data).find((value) => value.id === post.id);
    assert(matches(post, { id: found?.id, data: found }), `${post.id}: public metadata/content mismatch`);
    assert(Number.isFinite(Date.parse(found.publicadoEl)), `${post.id}: publication date missing`);
  }
};
const before = await readPosts();
const existing = before.filter((row) => posts.some((post) => post.id === row.id || post.slug === row.data.slug));
if (existing.length) {
  assert(existing.length === 3 && posts.every((post) => existing.some((row) => matches(post, row))), 'Collision or partial publication; no writes performed');
  await verifyPublic();
  console.log(JSON.stringify({ alreadyPublished: 3, publicVerification: 'passed', writes: 0 }));
  process.exit(0);
}
for (const post of posts) {
  const related = [...post.contenido.matchAll(/\]\(\/blog\/([^()]+)\)/g)].map((match) => match[1]);
  assert(related.every((slug) => before.some((row) => row.data.slug === slug && row.data.estado === 'publicado')), `${post.id}: related guide not published`);
}
const timestamp = new Date().toISOString();
const rows = posts.map((post) => ({ collection: 'posts', id: post.id, data: { ...post, estado: 'publicado', actualizadoEl: timestamp } }));
for (const row of rows) {
  const { error } = await client.rpc('mnt_validate_record', { c: 'posts', record_id: row.id, d: row.data });
  if (error) throw new Error(`Server validation failed for ${row.id} (${error.code})`);
}
console.log(JSON.stringify({ remoteValidation: 'passed', existingPosts: before.length, additions: 3, publish }));
if (!publish) process.exit(0);
const evidence = new URL(`../.superpowers/news/publication-${timestamp.replace(/[:.]/g, '-')}/`, import.meta.url);
await mkdir(evidence, { recursive: true });
await writeFile(new URL('before.json', evidence), JSON.stringify(before, null, 2));
await writeFile(new URL('manifest.json', evidence), JSON.stringify({ timestamp, manifest }, null, 2));
// Single atomic insert. Never overwrite existing content. Database stamps first publication.
const { error } = await client.from('mnt_records').insert(rows);
if (error) throw new Error(`Insert failed (${error.code}); inspect remote state before retrying`);
const after = await readPosts();
await writeFile(new URL('after.json', evidence), JSON.stringify(after, null, 2));
assert(after.length === before.length + 3 && posts.every((post) => after.some((row) => matches(post, row) && Number.isFinite(Date.parse(row.data.publicadoEl)))), 'Stored publication mismatch');
assert(before.every((old) => after.some((row) => row.id === old.id && digest(row) === digest(old))), 'Existing record changed; inspect snapshot');
await verifyPublic();
console.log(JSON.stringify({ published: 3, totalPosts: after.length, existingUnchanged: before.length, publicVerification: 'passed', evidence: evidence.pathname }));
