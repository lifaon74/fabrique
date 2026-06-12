import {
  isPackageJsonExportsEntry,
  isPackageJsonExportsFallback,
  type PackageJsonExportsEntryOrFallback,
} from '../../../../../file/package-json/package-json-exports/package-json-exports.ts';
import { replacePackageJsonExportsEntryTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-ts-extensions-with-js-extensions.ts';
import { replacePackageJsonExportsFallbackTsExtensionsWithJsExtensions } from './replace-package-json-exports-fallback-ts-extensions-with-js-extensions.ts';

export function replacePackageJsonExportsEntryOrFallbackTsExtensionsWithJsExtensions(
  input: PackageJsonExportsEntryOrFallback,
): PackageJsonExportsEntryOrFallback {
  if (isPackageJsonExportsEntry(input)) {
    return replacePackageJsonExportsEntryTsExtensionsWithJsExtensions(input);
  } else if (isPackageJsonExportsFallback(input)) {
    return replacePackageJsonExportsFallbackTsExtensionsWithJsExtensions(input);
  } else {
    throw new Error(`Unknown type ${typeof input}.`);
  }
}
