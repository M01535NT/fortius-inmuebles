import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// One-time editorial batch. Default mode checks local files without network access.
const directory = new URL('../content/blog/2026-09/', import.meta.url);
const files = (await readdir(directory)).filter((file) => /^\d{2}\.json$/.test(file)).sort();
const posts = await Promise.all(files.map(async (file) => JSON.parse(await readFile(new URL(file, directory), 'utf8'))));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const digest = (post) => createHash('sha256').update(JSON.stringify({ id: post.id, slug: post.slug, titulo: post.titulo, resumen: post.resumen, contenido: post.contenido })).digest('hex');
assert(posts.length === 12, 'Expected exactly 12 articles');
assert(new Set(posts.map((post) => post.id)).size === 12, 'Duplicate article ID');
assert(new Set(posts.map((post) => post.slug)).size === 12, 'Duplicate article slug');
const slugs = new Set(posts.map((post) => post.slug));
const manifest = [];
for (const [index, post] of posts.entries()) {
  assert(post.id === `fortius-inmuebles-blog-202609-${String(index + 1).padStart(2, '0')}`, 'Unexpected article ID');
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug), `${post.id}: invalid slug`);
  assert(post.titulo.length > 0 && post.titulo.length <= 160, `${post.id}: invalid title`);
  assert(post.resumen.length >= 130 && post.resumen.length <= 180, `${post.id}: invalid summary length`);
  const visible = post.contenido.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^#{2,3}\s+|^\d+\.\s+|^-\s+/gm, '');
  const words = visible.trim().split(/\s+/).length;
  assert(words >= 800 && words <= 1100, `${post.id}: ${words} words, expected 800–1100`);
  assert(!/<[^>]+>/.test(post.contenido), `${post.id}: unexpected HTML`);
  assert(post.contenido.includes('## Fuentes y revisión') && post.contenido.includes('23 de septiembre de 2026'), `${post.id}: missing sources/review date`);
  const links = [...post.contenido.matchAll(/\[([^\]\n]+)\]\(([^()\n]*)\)/g)].map((match) => match[2]);
  for (const link of links) {
    assert(!/[\s\\]/.test(link) && (/^https:\/\//.test(link) || /^\/(?!\/)/.test(link)), `${post.id}: unsafe link`);
    if (link.startsWith('/blog/')) assert(slugs.has(link.slice(6)), `${post.id}: unknown related article`);
    else if (link.startsWith('/')) await readFile(new URL(`../src/app${link}/page.tsx`, import.meta.url));
  }
  assert(links.filter((link) => link.startsWith('/blog/')).length >= 2, `${post.id}: missing related links`);
  assert(links.some((link) => link.startsWith('https://')), `${post.id}: missing sources`);
  manifest.push({ id: post.id, slug: post.slug, words, sha256: digest(post) });
}
console.log(JSON.stringify({ localValidation: 'passed', manifest }, null, 2));

const publish = process.argv.includes('--publish');
if (!publish && !process.argv.includes('--check-remote')) process.exit(0);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url === 'https://qkkirjzhviqwvuqjnmei.supabase.co', 'Unexpected target project or insecure protocol');
assert(key, 'Missing service credential');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const readPosts = async () => {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('fortius_inmuebles_records').select('id,data,version,created_at,updated_at').eq('collection', 'posts').order('id').range(offset, offset + 499);
    if (error) throw new Error(`Cannot inventory posts (${error.code})`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
};
const before = await readPosts();
const existing = before.filter((row) => posts.some((post) => post.id === row.id || post.slug === row.data.slug));
if (existing.length) {
  assert(existing.length === 12 && posts.every((post) => existing.some((row) => row.id === post.id && digest(row.data) === digest(post) && row.data.estado === 'publicado')), 'Existing content conflicts with this batch; nothing changed');
  console.log(JSON.stringify({ remote: 'all 12 articles already published with matching hashes; no changes' }));
  process.exit(0);
}
const timestamp = new Date().toISOString();
const rows = posts.map((post) => ({ collection: 'posts', id: post.id, data: { ...post, estado: 'publicado', actualizadoEl: timestamp } }));
for (const row of rows) {
  const { error } = await client.rpc('fortius_inmuebles_validate_record', { c: 'posts', record_id: row.id, d: row.data });
  if (error) throw new Error(`Server validation rejected ${row.id} (${error.code})`);
}
console.log(JSON.stringify({ remoteValidation: 'passed', existingPosts: before.length, additions: 12, publish }));
if (!publish) process.exit(0);
const evidence = new URL(`../.superpowers/blog-12/publication-${timestamp.replace(/[:.]/g, '-')}/`, import.meta.url);
await mkdir(evidence, { recursive: true });
await writeFile(new URL('before.json', evidence), JSON.stringify(before, null, 2));
await writeFile(new URL('manifest.json', evidence), JSON.stringify({ timestamp, manifest }, null, 2));
// A single INSERT is atomic. Never upsert or replace existing editorial content.
const { error } = await client.from('fortius_inmuebles_records').insert(rows);
if (error) throw new Error(`Insert rejected (${error.code}); check remote state before retrying`);
const after = await readPosts();
assert(posts.every((post) => after.some((row) => row.id === post.id && digest(row.data) === digest(post) && row.data.estado === 'publicado')), 'Readback failed; inspect publication evidence');
assert(before.every((old) => after.some((row) => row.id === old.id && row.version === old.version && digest(row.data) === digest(old.data))), 'Existing record changed concurrently; inspect before snapshot');
await writeFile(new URL('after.json', evidence), JSON.stringify(after, null, 2));
console.log(JSON.stringify({ published: 12, persistedHashes: '12/12 match', timestamp }));
