import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * @param {string} path
 * @param {string|NodeJS.ArrayBufferView} content
 * @param {any?} options
 * @return {Promise<void>}
 */
export async function writeFileSafe(path, content, options) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, options);
}
