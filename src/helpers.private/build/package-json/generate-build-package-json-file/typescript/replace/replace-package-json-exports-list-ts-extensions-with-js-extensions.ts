import type {
  PackageJsonExportsEntryOrFallback,
  PackageJsonExportsList,
} from '../../../../../file/package-json/package-json-exports/package-json-exports.ts';

import { replacePackageJsonExportsEntryOrFallbackTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-or-fallback-ts-extensions-with-js-extensions.ts';
import { replacePackageJsonExportsEntryTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-ts-extensions-with-js-extensions.ts';

export function replacePackageJsonExportsListTsExtensionsWithJsExtensions({
  '.': main,
  ...others
}: PackageJsonExportsList): PackageJsonExportsList {
  return {
    ['.']: replacePackageJsonExportsEntryTsExtensionsWithJsExtensions(main),
    ...Object.fromEntries([
      ...Object.entries(others).map(
        ([key, value]: [string, PackageJsonExportsEntryOrFallback]): [
          string,
          PackageJsonExportsEntryOrFallback,
        ] => {
          return [key, replacePackageJsonExportsEntryOrFallbackTsExtensionsWithJsExtensions(value)];
        },
      ),
    ]),
  };
}
