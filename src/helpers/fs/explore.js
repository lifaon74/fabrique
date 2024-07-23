import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * @param {string} path
 * @return {AsyncGenerator<readonly [path: string, stats: Stats]>}
 */
export async function* explore(path) {
  const stats = await lstat(path);
  yield [path, stats];

  if (stats.isDirectory()) {
    const files = await readdir(path);
    for (const file of files) {
      yield* explore(join(path, file));
    }
  }
}
