
import type { NextAuthConfig } from 'next-auth';
import { env } from '../env';
 
export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page
  },
  secret: env.AUTH_SECRET,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/panel');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnCreate = nextUrl.pathname.startsWith('/create');

      const protectedRoutes = isOnDashboard || isOnAdmin || isOnCreate;

      if (protectedRoutes) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // If logged in user is on login or signup page, redirect to home
        if (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/signup')) {
            return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        // On sign in, persist the user data to the token
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      // Pass user data from the token to the session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'ADMIN' | 'USER';
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  providers: [], // Add providers in the main auth.ts file
} satisfies NextAuthConfig;
