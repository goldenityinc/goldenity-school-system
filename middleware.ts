import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET ?? "dev-nextauth-secret-change-me",
  pages: {
    signIn: "/login"
  }
});

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
