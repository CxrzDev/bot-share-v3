import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      currentPackageId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    currentPackageId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    currentPackageId: string | null;
  }
}
