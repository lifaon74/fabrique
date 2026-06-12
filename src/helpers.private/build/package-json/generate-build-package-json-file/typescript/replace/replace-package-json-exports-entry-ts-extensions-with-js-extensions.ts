import {
  isPackageJsonExportsEntryObject,
  isPackageJsonExportsEntryPath,
  type PackageJsonExportsEntry,
} from '../../../../../file/package-json/package-json-exports/package-json-exports.ts';

import { replacePackageJsonExportsEntryObjectTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-object-ts-extensions-with-js-extensions.ts';
import { replacePackageJsonExportsEntryPathTsExtensionsWithJsExtensions } from './replace-package-json-exports-entry-path-ts-extensions-with-js-extensions.ts';

export function replacePackageJsonExportsEntryTsExtensionsWithJsExtensions(
  input: PackageJsonExportsEntry,
): PackageJsonExportsEntry {
  if (isPackageJsonExportsEntryPath(input)) {
    return replacePackageJsonExportsEntryPathTsExtensionsWithJsExtensions(input);
  } else if (isPackageJsonExportsEntryObject(input)) {
    return replacePackageJsonExportsEntryObjectTsExtensionsWithJsExtensions(input);
  } else {
    throw new Error(`Unknown type ${typeof input}.`);
  }
}
