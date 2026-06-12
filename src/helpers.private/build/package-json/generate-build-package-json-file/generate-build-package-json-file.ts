import type { PackageJson } from '../../../file/package-json/package-json.ts';
import { removeUndefinedProperties } from '../../../misc/object/remove-undefined-properties.ts';
import type { BuildMode } from '../../build-mode/build-mode.ts';
import { generatePackageJsonBuildVersion } from '../generate-package-json-build-version/generate-package-json-build-version.ts';
import { replacePackageJsonExportsTsExtensionsWithJsExtensions } from './typescript/replace/replace-package-json-exports-ts-extensions-with-js-extensions.ts';
import { replaceTsExtensionWithJsExtension } from './typescript/replace/replace-ts-extension-with-js-extension.ts';

export interface GenerateBuildPackageJsonFileOptions {
  readonly mode?: BuildMode;
}

export function generateBuildPackageJsonFile(
  {
    name,
    version,
    type,
    description,
    keywords,
    author,
    license,
    repository,
    main,
    bin,
    module,
    types,
    exports,
    dependencies,
    peerDependencies,
    optionalDependencies,
  }: PackageJson,
  { mode = 'prod' }: GenerateBuildPackageJsonFileOptions = {},
): PackageJson {
  return removeUndefinedProperties({
    name,
    version: generatePackageJsonBuildVersion({
      version,
      mode,
    }),
    type,
    description,
    keywords,
    author,
    license,
    repository,
    main: main === undefined ? undefined : replaceTsExtensionWithJsExtension(main),
    bin: bin === undefined ? undefined : replaceTsExtensionWithJsExtension(bin),
    module: module === undefined ? undefined : replaceTsExtensionWithJsExtension(module),
    types,
    exports:
      exports === undefined
        ? undefined
        : replacePackageJsonExportsTsExtensionsWithJsExtensions(exports),
    dependencies,
    peerDependencies,
    optionalDependencies,
  });
}
