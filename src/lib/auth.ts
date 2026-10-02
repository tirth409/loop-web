import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { workspace: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceName: user.workspace.name,
        };
      },
    }),
  ],
    callbacks: {
    async jwt({ token, user }) {
      // Sign-in: copy the user's details into the token.
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.workspaceId = (user as any).workspaceId;
        token.workspaceName = (user as any).workspaceName;
        return token;
      }

      // Every later request: re-check the database so a role change or a
      // removal takes effect immediately, not when the token expires.
      if (token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id },
          select: {
            name: true,
            role: true,
            workspaceId: true,
            workspace: { select: { name: true } },
          },
        });
        if (!fresh) {
          return {} as typeof token; // user was removed → invalidate the token
        }
        token.name = fresh.name;
        token.role = fresh.role;
        token.workspaceId = fresh.workspaceId;
        token.workspaceName = fresh.workspace.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Removed user: return a session with no user, so every API route
      // answers 401 and the app sends them back to /login.
      if (!token.id) {
        return { expires: session.expires } as unknown as typeof session;
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as any;
        session.user.workspaceId = token.workspaceId as string;
        session.user.workspaceName = token.workspaceName as string;
      }
      return session;
    },
  },
};