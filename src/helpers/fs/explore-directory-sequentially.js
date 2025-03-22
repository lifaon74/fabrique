import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * @param {string} path
 * @param {(path: string, entry: Dirent) => Promise<void | string> | void | string} callback
 * @return {Promise<void>}
 */
export async function exploreDirectorySequentially(path, callback) {
  const entries = await readdir(path, { withFileTypes: true });

  for (const entry of entries) {
    const subPath = join(path, entry.name);
    const newPath = (await callback(subPath, entry)) ?? subPath;
    if (entry.isDirectory()) {
      await exploreDirectorySequentially(newPath, callback);
    }
  }
}
