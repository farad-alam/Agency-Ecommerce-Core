import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
};

// Routes where authenticated users should be redirected away
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

// Protected routes and minimum required roles
const ROLE_PROTECTED = [
  { pattern: "/dashboard", roles: ["ADMIN", "STAFF"] },
  { pattern: "/account", roles: ["ADMIN", "STAFF", "CUSTOMER"] },
] as const;

export default auth(function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Get session from auth middleware wrapper
  const session = (req as unknown as { auth: { user?: { id: string; role: string } } | null }).auth;

  // Apply security headers to all responses
  const res = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Skip middleware for API routes, static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return res;
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    if (session?.user) {
      const dest = session.user.role === "CUSTOMER" ? "/" : "/dashboard";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }
    return res;
  }

  // Role-based protection for page routes
  for (const { pattern, roles } of ROLE_PROTECTED) {
    if (pathname.startsWith(pattern)) {
      if (!session?.user) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (!roles.includes(session.user.role as never)) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }

      break;
    }
  }

  return res;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
