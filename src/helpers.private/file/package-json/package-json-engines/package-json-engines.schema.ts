import * as z from 'zod';

export const packageJsonEnginesSchema = z.record(z.string(), z.string());
