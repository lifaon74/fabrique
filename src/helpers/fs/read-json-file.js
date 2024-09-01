import { readFile } from 'node:fs/promises';

/**
 * Reads a json file.
 *
 * @param {string} path
 * @return {Promise<any>}
 */
export async function readJsonFile(path) {
  return JSON.parse(await readFile(path, { encoding: 'utf8' }));
}
