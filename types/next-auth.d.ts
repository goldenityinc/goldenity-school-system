import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId: string | null;
      activeModules: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    tenantId: string | null;
    activeModules: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    tenantId?: string | null;
    activeModules?: string[];
  }
}
