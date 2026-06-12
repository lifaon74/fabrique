import { toRelativePath } from '../../../../../path/to-relative-path.ts';

export function replaceTsExtensionWithJsExtension(path: string): string {
  return toRelativePath(path.endsWith('.d.ts') ? path : path.replace(/\.ts$/, '.js'));
}

export function replaceTsExtensionWithDTsExtension(path: string): string {
  return toRelativePath(path.endsWith('.d.ts') ? path : path.replace(/\.ts$/, '.d.ts'));
}
