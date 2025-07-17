import * as path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Carga .env desde la raíz del proyecto aunque el proceso arranque en otro cwd.
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const EnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL no es una URL válida en .env'),
});

try {
  EnvSchema.parse(process.env);
} catch (error) {
  console.error('Error de validación de variables de entorno:', error);
  if (error instanceof z.ZodError) {
    throw new Error(`Faltan variables de entorno o son inválidas: ${error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`).join(', ')}`);
  }
  throw new Error('Error desconocido al validar las variables de entorno.');
}

export const env = EnvSchema.parse(process.env);
