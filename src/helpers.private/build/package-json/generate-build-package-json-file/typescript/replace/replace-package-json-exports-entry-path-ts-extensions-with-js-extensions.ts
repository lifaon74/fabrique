import type { PackageJsonExportsEntryPath } from '../../../../../file/package-json/package-json-exports/package-json-exports.ts';
import { replaceTsExtensionWithJsExtension } from './replace-ts-extension-with-js-extension.ts';

export function replacePackageJsonExportsEntryPathTsExtensionsWithJsExtensions(
  input: PackageJsonExportsEntryPath,
): PackageJsonExportsEntryPath {
  return input === null ? null : replaceTsExtensionWithJsExtension(input);
}
