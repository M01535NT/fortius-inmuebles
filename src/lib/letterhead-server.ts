import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LETTERHEAD_PATHS, type LetterheadAssets } from './letterhead';

export async function loadLetterhead(): Promise<LetterheadAssets> {
  const [encabezado, pie] = await Promise.all(Object.values(LETTERHEAD_PATHS).map(path => readFile(join(process.cwd(), 'public', path))));
  return { encabezado, pie };
}
