
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from '@/lib/auth.config';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { User as DbUser } from '@/lib/types';

async function getUser(email: string): Promise<(DbUser & { password?: string }) | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    
    // Adapt prisma user to our DbUser type
    return {
        ...user,
        avatarUrl: user.image,
        duelsCreated: user.duelsCreated ?? 0,
        votesCast: user.votesCast ?? 0,
        role: user.role as 'ADMIN' | 'USER',
        createdAt: user.createdAt?.toISOString(),
    };
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
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword as any; // Cast to any to satisfy NextAuth type
          }
        }
        
        console.log('Authorization failed: Invalid credentials.');
        return null;
      },
    }),
  ],
});

export const { GET, POST } = handlers;
