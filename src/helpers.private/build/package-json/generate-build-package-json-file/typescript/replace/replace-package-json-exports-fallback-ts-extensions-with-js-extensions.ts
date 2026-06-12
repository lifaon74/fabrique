import type { PackageJsonExportsFallback } from '../../../../../file/package-json/package-json-exports/package-json-exports.ts';
import { replacePackageJsonExportsEntryTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-ts-extensions-with-js-extensions.ts';

export function replacePackageJsonExportsFallbackTsExtensionsWithJsExtensions(
  input: PackageJsonExportsFallback,
): PackageJsonExportsFallback {
  return input.map(replacePackageJsonExportsEntryTsExtensionsWithJsExtensions);
}
