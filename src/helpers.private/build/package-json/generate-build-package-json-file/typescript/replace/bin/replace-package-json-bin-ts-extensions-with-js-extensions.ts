import type { PackageJsonBin } from '../../../../../../file/package-json/package-json-bin/package-json-bin.ts';
import { isPackageJsonBinObject } from '../../../../../../file/package-json/package-json-bin/types/object/is-package-json-bin-object.ts';
import { isPackageJsonBinString } from '../../../../../../file/package-json/package-json-bin/types/string/is-package-json-bin-string.ts';
import { replacePackageJsonBinObjectTsExtensionsWithJsExtensions } from './replace-package-json-bin-object-ts-extensions-with-js-extensions.ts';
import { replacePackageJsonBinStringTsExtensionsWithJsExtensions } from './replace-package-json-bin-string-ts-extensions-with-js-extensions.ts';

export function replacePackageJsonBinTsExtensionsWithJsExtensions(
  input: PackageJsonBin,
): PackageJsonBin {
  if (isPackageJsonBinString(input)) {
    return replacePackageJsonBinStringTsExtensionsWithJsExtensions(input);
  } else if (isPackageJsonBinObject(input)) {
    return replacePackageJsonBinObjectTsExtensionsWithJsExtensions(input);
  } else {
    throw new Error(`Unknown type ${typeof input}.`);
  }
}
