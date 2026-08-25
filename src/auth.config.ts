import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js options (no Prisma / bcrypt).
 * Used by middleware so the Edge bundle stays under Vercel’s 1 MB limit.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      if (isAdminRoute) return !!auth;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "ADMIN";
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
