import type { PackageJsonBinString } from '../../../../../../file/package-json/package-json-bin/types/string/package-json-bin-string.ts';
import { replaceTsExtensionWithJsExtension } from '../replace-ts-extension-with-js-extension.ts';

export function replacePackageJsonBinStringTsExtensionsWithJsExtensions(
  input: PackageJsonBinString,
): PackageJsonBinString {
  return replaceTsExtensionWithJsExtension(input);
}
