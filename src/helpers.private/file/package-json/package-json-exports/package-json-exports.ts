export type PackageJsonExports =
  | PackageJsonExportsEntryPath
  | PackageJsonExportsList
  | PackageJsonExportsEntryObject
  | PackageJsonExportsFallback;

/*--*/

export type PackageJsonExportsEntryPath = string | null;

export function isPackageJsonExportsEntryPath(
  input: unknown,
): input is PackageJsonExportsEntryPath {
  return typeof input === 'string' || input === null;
}

/*--*/

export interface PackageJsonExportsList {
  readonly '.': PackageJsonExportsEntry;
  readonly [key: `./${string}`]: PackageJsonExportsEntryOrFallback;
}

export function isPackageJsonExportsList(input: unknown): input is PackageJsonExportsList {
  return typeof input === 'object' && input !== null && Reflect.has(input, '.');
}

/*--*/

export type PackageJsonExportsEntry = PackageJsonExportsEntryPath | PackageJsonExportsEntryObject;

export function isPackageJsonExportsEntry(input: unknown): input is PackageJsonExportsEntry {
  return isPackageJsonExportsEntryPath(input) || isPackageJsonExportsEntryObject(input);
}

/*--*/

export type PackageJsonExportsFallback = readonly PackageJsonExportsEntry[];

export function isPackageJsonExportsFallback(input: unknown): input is PackageJsonExportsFallback {
  return Array.isArray(input) && input.every(isPackageJsonExportsEntry);
}

/*--*/

export type PackageJsonExportsEntryOrFallback =
  | PackageJsonExportsEntry
  | PackageJsonExportsFallback;

export function isPackageJsonExportsEntryOrFallback(
  input: unknown,
): input is PackageJsonExportsEntryOrFallback {
  return isPackageJsonExportsEntry(input) || isPackageJsonExportsFallback(input);
}

/*--*/

export interface PackageJsonExportsEntryObject {
  readonly require?: PackageJsonExportsEntryOrFallback;
  readonly import?: PackageJsonExportsEntryOrFallback;
  readonly node?: PackageJsonExportsEntryOrFallback;
  readonly default?: PackageJsonExportsEntryOrFallback;
  readonly types?: PackageJsonExportsEntryOrFallback;
}

const PACKAGE_JSON_EXPORTS_ENTRY_OBJECT_KEYS = new Set([
  'require',
  'import',
  'node',
  'default',
  'types',
]);

export function isPackageJsonExportsEntryObject(
  input: unknown,
): input is PackageJsonExportsEntryObject {
  return (
    typeof input === 'object' &&
    input !== null &&
    Object.entries(input).every(([key, value]): boolean => {
      return (
        PACKAGE_JSON_EXPORTS_ENTRY_OBJECT_KEYS.has(key) &&
        isPackageJsonExportsEntryOrFallback(value)
      );
    })
  );
}
