import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentSession } from "./auth";
import type { UserRole } from "@constela/types";

// ==============================================
// Role Definitions
// ==============================================

type RouteRole = UserRole | UserRole[] | "PUBLIC" | "AUTHENTICATED";

interface RouteConfig {
  roles: RouteRole;
  tenantRequired?: boolean;
}

const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // Public routes
  "/": { roles: "PUBLIC" },
  "/login": { roles: "PUBLIC" },
  "/register": { roles: "PUBLIC" },
  "/forgot-password": { roles: "PUBLIC" },
  "/api/auth/": { roles: "PUBLIC" },

  // Authenticated routes
  "/api/auth/logout": { roles: "AUTHENTICATED" },
  "/api/auth/me": { roles: "AUTHENTICATED" },

  // Client routes
  "/client": { roles: "CLIENT", tenantRequired: true },
  "/api/client/": { roles: "CLIENT", tenantRequired: true },

  // Practitioner routes
  "/practitioner": { roles: "PRACTITIONER", tenantRequired: true },
  "/api/practitioner/": { roles: "PRACTITIONER", tenantRequired: true },

  // Admin routes
  "/admin": { roles: "PLATFORM_ADMIN" },
  "/api/admin/": { roles: "PLATFORM_ADMIN" },
};

// ==============================================
// Helper Functions
// ==============================================

function matchRoute(pathname: string): RouteConfig | null {
  // Exact match
  if (ROUTE_CONFIG[pathname]) {
    return ROUTE_CONFIG[pathname];
  }

  // Prefix match for API routes
  for (const route of Object.keys(ROUTE_CONFIG)) {
    if (pathname.startsWith(route)) {
      return ROUTE_CONFIG[route];
    }
  }

  return null;
}

function hasRole(userRole: UserRole, allowedRoles: RouteRole): boolean {
  if (allowedRoles === "PUBLIC" || allowedRoles === "AUTHENTICATED") {
    return true;
  }

  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }

  return userRole === allowedRoles;
}

// ==============================================
// Auth Middleware
// ==============================================

export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const routeConfig = matchRoute(pathname);

  // If no config, allow (default to authenticated for safety)
  if (!routeConfig) {
    return NextResponse.next();
  }

  // Get session
  const session = await getCurrentSession();

  // Check if public route
  if (routeConfig.roles === "PUBLIC") {
    // If already logged in, redirect to dashboard
    if (session && (pathname === "/login" || pathname === "/register")) {
      const dashboard = getDashboardRoute(session.role);
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return NextResponse.next();
  }

  // Check authentication
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  // Check role authorization
  if (!hasRole(session.role, routeConfig.roles)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }
    // Redirect to own dashboard
    const dashboard = getDashboardRoute(session.role);
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Check tenant requirement
  if (routeConfig.tenantRequired && !session.tenantId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden", message: "Tenant access required" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Attach user to request headers for API routes
  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-user-role", session.role);
    requestHeaders.set("x-user-tenant", session.tenantId || "");
    requestHeaders.set("x-user-email", session.email);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

// ==============================================
// Dashboard Route Helper
// ==============================================

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case "PLATFORM_ADMIN":
      return "/admin";
    case "TENANT_ADMIN":
    case "PRACTITIONER":
      return "/practitioner";
    case "CLIENT":
      return "/client";
    case "GUEST":
    case "OBSERVER":
      return "/";
    default:
      return "/";
  }
}

// ==============================================
// Require Auth Helper (for API routes)
// ==============================================

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ==============================================
// Require Role Helper (for API routes)
// ==============================================

export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

// ==============================================
// Tenant Isolation Helper
// ==============================================

export async function requireTenantAccess(tenantId: string) {
  const session = await requireAuth();

  // Platform admin can access all tenants
  if (session.role === "PLATFORM_ADMIN") {
    return session;
  }

  // Check if user belongs to the tenant
  if (session.tenantId !== tenantId) {
    throw new Error("Forbidden: Tenant access denied");
  }

  return session;
}

// ==============================================
// Create Audit Log Helper
// ==============================================

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  payload?: Record<string, unknown>
) {
  const session = await getCurrentSession().catch(() => null);

  if (!session) return;

  // This should be imported from db in actual implementation
  // await prisma.auditLog.create({
  //   data: {
  //     userId: session.userId,
  //     tenantId: session.tenantId,
  //     action,
  //     entityType,
  //     entityId,
  //     payload,
  //   },
  // });
}
