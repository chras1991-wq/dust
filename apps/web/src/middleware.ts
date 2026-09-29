import { NextResponse, type NextRequest } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
};

function applySecurity(res: NextResponse, pathname: string) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  if (pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.headers.set("Pragma", "no-cache");
  }
  // Hide framework fingerprint on responses we control.
  res.headers.delete("x-powered-by");
  return res;
}

function adminAuthorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected || expected.length < 16) return false;
  const header = req.headers.get("x-admin-token")?.trim();
  const cookie = req.cookies.get("admin_token")?.value?.trim();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return header === expected || cookie === expected || bearer === expected;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block common scanner / source-map probes — never serve maps or VCS.
  if (
    pathname.endsWith(".map") ||
    pathname.includes("/.git") ||
    pathname.includes("/.env") ||
    pathname.includes("/node_modules") ||
    pathname.includes("/.next/") ||
    pathname.endsWith(".ts") ||
    pathname.endsWith(".tsx")
  ) {
    return applySecurity(
      new NextResponse(null, { status: 404 }),
      pathname
    );
  }

  // Admin is observational only and gated — no public back office.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!adminAuthorized(req)) {
      return applySecurity(
        new NextResponse(null, { status: 404 }),
        pathname
      );
    }
  }

  const res = NextResponse.next();
  return applySecurity(res, pathname);
}

export const config = {
  matcher: [
    /*
     * All paths except Next static assets that must stay cacheable.
     * _next/static & _next/image still get CSP from next.config headers.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
