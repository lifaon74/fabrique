import type { BuildMode } from '../../build-mode/build-mode.ts';

export interface GeneratePackageJsonBuildVersionOptions {
  readonly version: string;
  readonly mode?: BuildMode;
  readonly prerelease?: string;
}

export function generatePackageJsonBuildVersion({
  version,
  mode = 'prod',
  prerelease,
}: GeneratePackageJsonBuildVersionOptions): string {
  if (version.includes('-')) {
    throw new Error(`Invalid version: ${version}.`);
  }

  return mode === 'prod' ? version : `${version}-${mode}.${prerelease ?? Date.now().toString(10)}`;
}
