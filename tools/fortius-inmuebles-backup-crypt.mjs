// REC-01: encrypt daily backups so only the owner can read them.
// Each file gets a fresh AES-256-GCM key, wrapped with the owner's RSA-4096 public key
// (RSA-OAEP-SHA256). The public key may live in the repository; the private key stays
// with the owner (password manager plus an offline copy) and is never stored by CI.
//
//   node tools/fortius-inmuebles-backup-crypt.mjs --generate-keys DIR     (owner, once)
//   node tools/fortius-inmuebles-backup-crypt.mjs --encrypt IN OUT --public-key PEM_FILE
//   node tools/fortius-inmuebles-backup-crypt.mjs --decrypt IN OUT --private-key PEM_FILE
import { createCipheriv, createDecipheriv, createHash, createPrivateKey, createPublicKey, generateKeyPairSync, privateDecrypt, publicEncrypt, randomBytes, constants } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

const MAGIC = 'fortius-backup-enc-v1';
const OAEP = { padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' };

export const keyId = publicPem => createHash('sha256').update(createPublicKey(publicPem).export({ type: 'spki', format: 'der' })).digest('hex').slice(0, 16);

/** Writes the key pair into a NEW directory; refuses to overwrite an existing key. */
export async function generateKeys(directory) {
  const dir = resolve(directory);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 4096 });
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
  await writeFile(resolve(dir, 'fortius-respaldo-privada.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }), { flag: 'wx', mode: 0o600 });
  await writeFile(resolve(dir, 'fortius-respaldo-publica.pem'), publicPem, { flag: 'wx' });
  return { keyId: keyId(publicPem), privateKey: resolve(dir, 'fortius-respaldo-privada.pem'), publicKey: resolve(dir, 'fortius-respaldo-publica.pem') };
}

export async function encryptFile(input, output, publicPem) {
  const key = randomBytes(32), iv = randomBytes(12);
  const header = Buffer.from(JSON.stringify({
    format: MAGIC, cipher: 'aes-256-gcm', wrap: 'rsa-oaep-sha256', keyId: keyId(publicPem),
    wrappedKey: publicEncrypt({ key: createPublicKey(publicPem), ...OAEP }, key).toString('base64'), iv: iv.toString('base64'),
  }) + '\n');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(header);
  const out = createWriteStream(output, { flags: 'wx', mode: 0o600 });
  out.write(header);
  await pipeline(createReadStream(input), cipher, out, { end: false });
  await new Promise((done, fail) => out.end(cipher.getAuthTag(), error => (error ? fail(error) : done())));
  return { keyId: keyId(publicPem), bytes: (await stat(output)).size };
}

async function readHeader(input) {
  const handle = await open(input, 'r');
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(4096), 0, 4096, 0);
    const end = buffer.subarray(0, bytesRead).indexOf(0x0a);
    if (end < 0) throw Error('Not an encrypted Fortius backup');
    const raw = buffer.subarray(0, end + 1);
    let header;
    try { header = JSON.parse(raw.toString('utf8')); } catch { throw Error('Not an encrypted Fortius backup'); }
    if (header?.format !== MAGIC || header.cipher !== 'aes-256-gcm' || header.wrap !== 'rsa-oaep-sha256') throw Error('Not an encrypted Fortius backup');
    return { header, raw, size: (await handle.stat()).size };
  } finally { await handle.close(); }
}

/** Decrypts and authenticates; a tampered file or the wrong key leaves no output behind. */
export async function decryptFile(input, output, privatePem) {
  const { header, raw, size } = await readHeader(input);
  const privateKey = createPrivateKey(privatePem);
  if (keyId(createPublicKey(privateKey).export({ type: 'spki', format: 'pem' })) !== header.keyId) throw Error('This backup was encrypted for a different key');
  const key = privateDecrypt({ key: privateKey, ...OAEP }, Buffer.from(header.wrappedKey, 'base64'));
  const tagStart = size - 16;
  if (tagStart < raw.length) throw Error('Encrypted backup is truncated');
  const tag = Buffer.alloc(16);
  const handle = await open(input, 'r');
  try { await handle.read(tag, 0, 16, tagStart); } finally { await handle.close(); }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(header.iv, 'base64'));
  decipher.setAAD(raw);
  decipher.setAuthTag(tag);
  try {
    await pipeline(createReadStream(input, { start: raw.length, end: tagStart - 1 }), decipher, createWriteStream(output, { flags: 'wx', mode: 0o600 }));
  } catch (error) {
    await rm(output, { force: true });
    throw Error('Encrypted backup failed authentication: it was altered or is incomplete' + (error.code === 'EEXIST' ? ' (output exists)' : ''));
  }
  return { keyId: header.keyId, bytes: (await stat(output)).size };
}

export async function main(args = process.argv.slice(2)) {
  const arg = name => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  if (args.includes('--generate-keys')) {
    const result = await generateKeys(arg('--generate-keys') ?? '.');
    console.log(JSON.stringify(result));
    console.log('Guarda la llave PRIVADA en tu gestor de contraseñas y una copia impresa o en USB en un lugar seguro. Sin ella no se pueden abrir las copias. Nunca la subas a GitHub.');
    return;
  }
  if (args.includes('--encrypt')) {
    const [input, output] = args.slice(args.indexOf('--encrypt') + 1);
    if (!input || !output || !arg('--public-key')) throw Error('Usage: --encrypt IN OUT --public-key PEM');
    console.log(JSON.stringify(await encryptFile(input, output, await readFile(arg('--public-key'), 'utf8'))));
    return;
  }
  if (args.includes('--decrypt')) {
    const [input, output] = args.slice(args.indexOf('--decrypt') + 1);
    if (!input || !output || !arg('--private-key')) throw Error('Usage: --decrypt IN OUT --private-key PEM');
    console.log(JSON.stringify(await decryptFile(input, output, await readFile(arg('--private-key'), 'utf8'))));
    return;
  }
  throw Error('Usage: --generate-keys DIR | --encrypt IN OUT --public-key PEM | --decrypt IN OUT --private-key PEM');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
