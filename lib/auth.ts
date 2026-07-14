import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyLoginWithCentralCommand } from "./services/central-command";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-nextauth-secret-change-me",
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const solution = typeof (credentials as Record<string, unknown>).solution === "string"
          ? ((credentials as Record<string, string>).solution ?? "")
          : undefined;

        const user = await verifyLoginWithCentralCommand(credentials.email, credentials.password, solution);
        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId ?? null;
        token.activeModules = Array.isArray(user.activeModules) ? user.activeModules : [];
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = String(token.role ?? "TEACHER");
        session.user.tenantId = token.tenantId ? String(token.tenantId) : null;
        session.user.activeModules = Array.isArray(token.activeModules) ? token.activeModules : [];
      }

      return session;
    }
  }
};
