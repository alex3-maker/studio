
import NextAuth, { type DefaultSession } from 'next-auth';
import type { User as DbUser } from '@/lib/types';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'USER';
    } & DefaultSession['user'];
  }

  // Override the default User type to include our custom fields
  interface User extends DbUser {}
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    role: 'ADMIN' | 'USER';
    name: string | null;
    email: string | null;
    picture: string | null;
  }
}
