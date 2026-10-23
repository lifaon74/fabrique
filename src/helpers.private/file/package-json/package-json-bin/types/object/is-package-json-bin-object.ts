import { packageJsonBinObjectSchema } from './package-json-bin-object.schema.ts';
import type { PackageJsonBinObject } from './package-json-bin-object.ts';

export function isPackageJsonBinObject(value: unknown): value is PackageJsonBinObject {
  return packageJsonBinObjectSchema.validate(value);
}
