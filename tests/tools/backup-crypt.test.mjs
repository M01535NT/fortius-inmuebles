import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { decryptFile, encryptFile, generateKeys } from '../../tools/fortius-inmuebles-backup-crypt.mjs';

test('encrypts for the owner key, decrypts byte for byte and rejects tampering, truncation and other keys', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fortius-crypt-'));
  try {
    const owner = await generateKeys(join(dir, 'owner'));
    const other = await generateKeys(join(dir, 'other'));
    await assert.rejects(generateKeys(join(dir, 'owner')), /EEXIST/);
    const plain = randomBytes(300_000);
    await writeFile(join(dir, 'backup.tgz'), plain);
    const publicPem = await readFile(owner.publicKey, 'utf8'), privatePem = await readFile(owner.privateKey, 'utf8');
    const enc = await encryptFile(join(dir, 'backup.tgz'), join(dir, 'backup.enc'), publicPem);
    assert.equal(enc.keyId, owner.keyId);
    const sealed = await readFile(join(dir, 'backup.enc'));
    assert.equal(sealed.includes(plain.subarray(0, 64)), false);
    await decryptFile(join(dir, 'backup.enc'), join(dir, 'restored.tgz'), privatePem);
    assert.deepEqual(await readFile(join(dir, 'restored.tgz')), plain);

    await assert.rejects(decryptFile(join(dir, 'backup.enc'), join(dir, 'x1'), await readFile(other.privateKey, 'utf8')), /different key/);
    const flipped = Buffer.from(sealed); flipped[flipped.length - 100] ^= 1;
    await writeFile(join(dir, 'flipped.enc'), flipped);
    await assert.rejects(decryptFile(join(dir, 'flipped.enc'), join(dir, 'x2'), privatePem), /authentication/);
    await assert.rejects(stat(join(dir, 'x2')), /ENOENT/);
    await writeFile(join(dir, 'short.enc'), sealed.subarray(0, sealed.length - 5000));
    await assert.rejects(decryptFile(join(dir, 'short.enc'), join(dir, 'x3'), privatePem), /authentication/);
    const header = sealed.toString('latin1', 0, sealed.indexOf(0x0a)).replace('"iv":"', '"iv":"A');
    await writeFile(join(dir, 'header.enc'), Buffer.concat([Buffer.from(header, 'latin1'), sealed.subarray(sealed.indexOf(0x0a))]));
    await assert.rejects(decryptFile(join(dir, 'header.enc'), join(dir, 'x4'), privatePem), /authentication|Invalid/i);
    await assert.rejects(decryptFile(join(dir, 'backup.tgz'), join(dir, 'x5'), privatePem), /Not an encrypted/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
