
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from '@/lib/auth.config';
import { mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';
import bcrypt from 'bcryptjs';

async function getUser(email: string): Promise<User | undefined> {
  const user = mockUsers.find((user) => user.email === email);
  return user as User | undefined;
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

          // En una app real, user.password sería el hash de la BD
          const passwordsMatch = await bcrypt.compare(password, user.password);

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
