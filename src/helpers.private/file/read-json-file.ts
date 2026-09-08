import type { PathLike, ReadFileOptionsWithStringEncoding } from 'node:fs';
import { type FileHandle, readFile } from 'node:fs/promises';

export async function readJsonFile<GValue = any>(
  path: PathLike | FileHandle,
  options?: ReadFileOptionsWithStringEncoding,
): Promise<GValue> {
  return JSON.parse(
    await readFile(path, {
      encoding: 'utf-8',
      ...options,
    }),
  );
}
