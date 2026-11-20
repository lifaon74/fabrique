import { packageJsonBinStringSchema } from './package-json-bin-string.schema.ts';
import type { PackageJsonBinString } from './package-json-bin-string.ts';

export function isPackageJsonBinString(value: unknown): value is PackageJsonBinString {
  return packageJsonBinStringSchema.validate(value);
}
