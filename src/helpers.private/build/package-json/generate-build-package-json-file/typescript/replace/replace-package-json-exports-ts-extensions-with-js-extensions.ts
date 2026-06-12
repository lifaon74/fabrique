import {
  isPackageJsonExportsEntryObject,
  isPackageJsonExportsEntryPath,
  isPackageJsonExportsFallback,
  isPackageJsonExportsList,
  type PackageJsonExports,
} from '../../../../../file/package-json/package-json-exports/package-json-exports.ts';

import { replacePackageJsonExportsEntryObjectTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-object-ts-extensions-with-js-extensions.ts';
import { replacePackageJsonExportsEntryPathTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-path-ts-extensions-with-js-extensions.ts';
import { replacePackageJsonExportsFallbackTsExtensionsWithJsExtensions } from './replace-package-json-exports-fallback-ts-extensions-with-js-extensions.ts';
import { replacePackageJsonExportsListTsExtensionsWithJsExtensions } from './replace-package-json-exports-list-ts-extensions-with-js-extensions.ts';

export function replacePackageJsonExportsTsExtensionsWithJsExtensions(
  input: PackageJsonExports,
): PackageJsonExports {
  if (isPackageJsonExportsEntryPath(input)) {
    return replacePackageJsonExportsEntryPathTsExtensionsWithJsExtensions(input);
  } else if (isPackageJsonExportsList(input)) {
    return replacePackageJsonExportsListTsExtensionsWithJsExtensions(input);
  } else if (isPackageJsonExportsEntryObject(input)) {
    return replacePackageJsonExportsEntryObjectTsExtensionsWithJsExtensions(input);
  } else if (isPackageJsonExportsFallback(input)) {
    return replacePackageJsonExportsFallbackTsExtensionsWithJsExtensions(input);
  } else {
    throw new Error(`Unknown type ${typeof input}.`);
  }
}
