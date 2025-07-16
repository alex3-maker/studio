
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from '@/lib/auth.config';
import { mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';
import bcrypt from 'bcryptjs';

async function getUser(email: string): Promise<(User & { password?: string }) | undefined> {
  // En una aplicación real, esto consultaría la base de datos.
  // pg.query('SELECT * FROM "User" WHERE email = $1', [email]);
  const user = mockUsers.find((user) => user.email === email);
  return user;
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
          
          const user = await getUser(email);
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);
          
          if (passwordsMatch) {
            // Return the full user object including the role
            return user;
          }
        }
        
        console.log('Autorización fallida: Credenciales inválidas.');
        return null;
      },
    }),
  ],
});

export const { GET, POST } = handlers;
