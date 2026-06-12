import { isAbsolute } from 'node:path';

export function toRelativePath(path: string): string {
  if (isAbsolute(path)) {
    throw new Error(`path must be relative: ${path}`);
  } else if (path === '.' || path.startsWith('./') || path === '..' || path.startsWith('../')) {
    return path;
  } else {
    return `./${path}`;
  }
}
