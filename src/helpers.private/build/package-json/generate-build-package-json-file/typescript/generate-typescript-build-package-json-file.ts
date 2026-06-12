import type { PackageJson } from '../../../../file/package-json/package-json.ts';
import {
  generateBuildPackageJsonFile,
  type GenerateBuildPackageJsonFileOptions,
} from '../generate-build-package-json-file.ts';
import { replaceTsExtensionWithDTsExtension } from './replace/replace-ts-extension-with-js-extension.ts';

export interface GenerateTypescriptBuildPackageJsonFileOptions extends GenerateBuildPackageJsonFileOptions {
  readonly indexFilePath: string;
  readonly protectedIndexFilePath: string | null;
}

export function generateTypescriptBuildPackageJsonFile(
  { types, exports, ...packageJson }: PackageJson,
  {
    indexFilePath,
    protectedIndexFilePath,
    ...options
  }: GenerateTypescriptBuildPackageJsonFileOptions,
): PackageJson {
  return generateBuildPackageJsonFile(
    {
      ...packageJson,
      main: indexFilePath,
      types: replaceTsExtensionWithDTsExtension(indexFilePath),
      exports: {
        '.': {
          types: replaceTsExtensionWithDTsExtension(indexFilePath),
          default: indexFilePath,
        },
        ...(protectedIndexFilePath === null
          ? {}
          : {
              './protected': {
                types: replaceTsExtensionWithDTsExtension(protectedIndexFilePath),
                default: protectedIndexFilePath,
              },
            }),
      },
    },
    options,
  );
}
