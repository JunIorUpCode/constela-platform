import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@constela/db";
import type { UserRole } from "@constela/types";

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-secret-change-in-production"
);

const COOKIE_NAME = "constela-session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
}

// ==============================================
// Password Hashing
// ==============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ==============================================
// JWT Token Management
// ==============================================

export async function createSessionToken(payload: Omit<SessionPayload, "exp" | "iat">): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(AUTH_SECRET);

  return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// ==============================================
// Cookie Session Management
// ==============================================

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ==============================================
// Session Management (with DB)
// ==============================================

export async function createSession(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive");
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  });

  // Update last login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    },
  });

  return token;
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  return verifySessionToken(token);
}

export async function endSession(userId: string): Promise<void> {
  // Create audit log before deleting cookie
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });

  if (user) {
    await prisma.auditLog.create({
      data: {
        userId,
        tenantId: user.tenantId,
        action: "LOGOUT",
        entityType: "User",
        entityId: userId,
      },
    });
  }

  await deleteSessionCookie();
}

// ==============================================
// Password Recovery
// ==============================================

export async function generatePasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  const token = await new SignJWT({ userId: user.id, type: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(AUTH_SECRET);

  return token;
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    if (payload.type !== "password-reset") return null;
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function resetPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "PASSWORD_RESET",
      entityType: "User",
      entityId: userId,
    },
  });
}
