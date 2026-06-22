import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/admin",
  "/practitioner",
  "/client",
  "/session",
];

// Routes only for guests (not logged in)
const GUEST_ONLY_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await getCurrentSession();

  // Check if it's a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if it's a guest-only route
  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // If trying to access protected route without auth
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access guest-only route while logged in
  if (isGuestOnlyRoute && session) {
    // Redirect based on role
    const dashboard = getDashboardUrl(session.role);
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Add user info to headers for API routes
  if (pathname.startsWith("/api/") && session) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-user-role", session.role);
    requestHeaders.set("x-user-tenant", session.tenantId || "");
    requestHeaders.set("x-user-email", session.email);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case "PLATFORM_ADMIN":
      return "/admin";
    case "PRACTITIONER":
    case "TENANT_ADMIN":
      return "/practitioner";
    case "CLIENT":
      return "/client";
    default:
      return "/";
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
