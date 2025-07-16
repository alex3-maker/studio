
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from '@/lib/auth.config';
import { mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';
import bcrypt from 'bcryptjs';

// NOTA: Esta es una implementación simulada.
// En una aplicación real, esto consultaría tu base de datos PostgreSQL.
async function getUser(email: string): Promise<User | undefined> {
  // Simula la búsqueda de un usuario en la base de datos
  const user = mockUsers.find((user) => user.email === email);
  return user ? { ...user, password: 'password123' } as User : undefined; // Añadimos un password de prueba
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          // Lógica de búsqueda de usuario (simulada)
          // const user = await getUserFromDb(email);
          const user = mockUsers.find(u => u.email === email);
          if (!user) return null;

          // Lógica de comparación de contraseñas (simulada)
          // const passwordsMatch = await bcrypt.compare(password, user.password);
          const passwordsMatch = password === 'password123'; // Simulación simple

          if (passwordsMatch) {
            // Devolvemos el usuario sin la contraseña
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword as any;
          }
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});
