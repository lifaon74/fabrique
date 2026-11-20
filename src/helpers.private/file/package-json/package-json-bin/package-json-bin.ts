import type { PackageJsonBinObject } from './types/object/package-json-bin-object.ts';
import type { PackageJsonBinString } from './types/string/package-json-bin-string.ts';

export type PackageJsonBin = PackageJsonBinString | PackageJsonBinObject;
