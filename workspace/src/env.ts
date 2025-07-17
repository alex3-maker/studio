import * as path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from the project root, even if the process starts elsewhere.
dotenv.config({ path: path.join(process.cwd(), '.env') });

const EnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL is not a valid URL'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET cannot be empty'),
});

export const env = EnvSchema.parse(process.env);
