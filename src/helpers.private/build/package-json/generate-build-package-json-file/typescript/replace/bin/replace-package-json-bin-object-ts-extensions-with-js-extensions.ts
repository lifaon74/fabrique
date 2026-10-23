import type { PackageJsonBinObject } from '../../../../../../file/package-json/package-json-bin/types/object/package-json-bin-object.ts';
import { replacePackageJsonBinStringTsExtensionsWithJsExtensions } from './replace-package-json-bin-string-ts-extensions-with-js-extensions.ts';

export function replacePackageJsonBinObjectTsExtensionsWithJsExtensions(
  input: PackageJsonBinObject,
): PackageJsonBinObject {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]: [string, string]): [string, string] => {
      return [key, replacePackageJsonBinStringTsExtensionsWithJsExtensions(value)];
    }),
  );
}
