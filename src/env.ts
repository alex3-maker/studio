import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL is not a valid URL'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET cannot be empty'),
});

export const env = EnvSchema.parse(process.env);
