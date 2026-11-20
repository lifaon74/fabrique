import * as z from 'zod';
import { packageJsonBinObjectSchema } from './types/object/package-json-bin-object.schema.ts';
import { packageJsonBinStringSchema } from './types/string/package-json-bin-string.schema.ts';

export const packageJsonBinSchema = z.union([
  packageJsonBinStringSchema,
  packageJsonBinObjectSchema,
]);
