import * as z from 'zod';

export const fabriqueConfigSchema = z.object({
  version: z.string().nonempty(),
  type: z.string().nonempty(),
});
