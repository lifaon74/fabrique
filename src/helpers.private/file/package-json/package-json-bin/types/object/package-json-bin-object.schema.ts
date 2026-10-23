import * as z from 'zod';

export const packageJsonBinObjectSchema = z.record(z.string(), z.string());
