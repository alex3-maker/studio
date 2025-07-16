
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from '@/lib/auth.config';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import type { User as DbUser } from '@/lib/types'; // Using our extended User type

async function getUser(email: string): Promise<(DbUser & { password?: string }) | undefined> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return user as (DbUser & { password?: string }) | undefined;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
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
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          }
        }
        
        console.log('Authorization failed: Invalid credentials.');
        return null;
      },
    }),
  ],
});

export const { GET, POST } = handlers;
