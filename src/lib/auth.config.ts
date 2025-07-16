
import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
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
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as 'ADMIN' | 'USER';
      }
      return session;
    },
  },
  providers: [], // Add providers in the main auth.ts file
} satisfies NextAuthConfig;
