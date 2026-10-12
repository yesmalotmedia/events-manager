import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// In-memory brute-force guard. This app runs as a single Railway instance
// (no horizontal scaling), so a plain in-process Map is enough — no need
// for Redis/a shared store. Keyed by client IP: 5 failed attempts locks
// that IP out for 15 minutes, regardless of which email/password it tries.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map(); // ip -> { count, lockedUntil }

function getClientIp(req) {
  const fwd = req?.headers?.get?.("x-forwarded-for") || req?.headers?.["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

function isLocked(ip) {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) return true;
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    attempts.delete(ip);
    return false;
  }
  return false;
}

function recordFailure(ip) {
  const entry = attempts.get(ip) || { count: 0, firstAttemptAt: Date.now() };
  if (Date.now() - entry.firstAttemptAt > WINDOW_MS) {
    entry.count = 0;
    entry.firstAttemptAt = Date.now();
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + WINDOW_MS;
  }
  attempts.set(ip, entry);
}

function recordSuccess(ip) {
  attempts.delete(ip);
}

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = getClientIp(req);
        if (isLocked(ip)) {
          throw new Error("יותר מדי ניסיונות כושלים — נסה שוב בעוד כמה דקות");
        }
        if (
          credentials?.email === process.env.ADMIN_EMAIL &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          recordSuccess(ip);
          return { id: "1", email: process.env.ADMIN_EMAIL, name: "מיאל" };
        }
        recordFailure(ip);
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
