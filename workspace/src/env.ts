import * as path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Carga .env desde la raíz del proyecto aunque el proceso arranque en otro cwd.
dotenv.config({ path: path.join(process.cwd(), '.env') });

const EnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL no es una URL válida'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET no puede estar vacío'),
});

export const env = EnvSchema.parse(process.env);
