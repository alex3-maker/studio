
import NextAuth, { type DefaultSession } from 'next-auth';

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

  interface User {
    role: 'ADMIN' | 'USER';
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    role: 'ADMIN' | 'USER';
  }
}
