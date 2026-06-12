import * as z from 'zod';

export const releaseModeSchema = z.enum(['dev', 'rc', 'prod']);
