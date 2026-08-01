import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute = nextUrl.pathname.startsWith('/api/health');
      const isLoginRoute = nextUrl.pathname.startsWith('/login');
      
      // Allow public routes
      if (isPublicRoute) return true;

      // Redirect authenticated users away from login page
      if (isLoginRoute) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      // Require authentication for all other routes
      if (!isLoggedIn) return false;

      // Role-based access control (RBAC) via middleware
      const role = (auth.user as any).role as string;
      const path = nextUrl.pathname;

      if (path.startsWith('/admin') && role !== 'OWNER' && role !== 'ADMIN') {
        return Response.redirect(new URL('/', nextUrl));
      }
      if (path.startsWith('/kasir') && role !== 'OWNER' && role !== 'ADMIN' && role !== 'KASIR') {
        return Response.redirect(new URL('/', nextUrl));
      }
      if (path.startsWith('/staff') && role !== 'OWNER' && role !== 'ADMIN' && role !== 'STAFF_GUDANG') {
        return Response.redirect(new URL('/', nextUrl));
      }
      if (path.startsWith('/opname') && role !== 'OWNER' && role !== 'ADMIN' && role !== 'STAFF_GUDANG') {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      // Pada saat pertama kali sign in, data 'user' akan tersedia
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).tenantId = token.tenantId as string;
      }
      return session;
    },
  },
  providers: [], // Diisi nanti di auth.ts
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
} satisfies NextAuthConfig;
