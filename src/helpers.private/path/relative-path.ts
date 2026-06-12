import { normalize } from 'node:path/posix';
import process from 'node:process';

export function relativePath(path: string, cwd: string = process.cwd()): string {
  path = normalize(path);
  cwd = normalize(cwd);

  return path.startsWith(cwd) ? normalize(path.slice(cwd.length + 1)) : path;
}
