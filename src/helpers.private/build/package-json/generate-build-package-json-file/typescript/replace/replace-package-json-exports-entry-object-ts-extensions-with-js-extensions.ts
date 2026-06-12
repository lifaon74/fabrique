import type {
  PackageJsonExportsEntryObject,
  PackageJsonExportsEntryOrFallback,
} from '../../../../../file/package-json/package-json-exports/package-json-exports.ts';
import { replacePackageJsonExportsEntryOrFallbackTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-or-fallback-ts-extensions-with-js-extensions.ts';

export function replacePackageJsonExportsEntryObjectTsExtensionsWithJsExtensions(
  input: PackageJsonExportsEntryObject,
): PackageJsonExportsEntryObject {
  return Object.fromEntries(
    Object.entries(input).map(
      ([key, value]: [string, PackageJsonExportsEntryOrFallback]): [
        string,
        PackageJsonExportsEntryOrFallback,
      ] => {
        return [key, replacePackageJsonExportsEntryOrFallbackTsExtensionsWithJsExtensions(value)];
      },
    ),
  );
}
