import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/",
    "/tours/:path*",
    "/suppliers/:path*",
    "/accounting/:path*",
    "/api/tours/:path*",
    "/api/suppliers/:path*",
    "/api/expenses/:path*",
    "/api/accounting/:path*",
    "/api/clients/:path*",
    "/api/documents/:path*",
    "/api/transactions/:path*",
    "/api/send-email",
    "/api/bug-report",
  ],
};
