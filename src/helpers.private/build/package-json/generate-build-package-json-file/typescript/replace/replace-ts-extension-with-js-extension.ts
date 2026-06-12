export function replaceTsExtensionWithJsExtension(path: string): string {
  return path.replace(/\.ts$/, '.js');
}

export function replaceTsExtensionWithDTsExtension(path: string): string {
  return path.replace(/\.ts$/, '.d.ts');
}
