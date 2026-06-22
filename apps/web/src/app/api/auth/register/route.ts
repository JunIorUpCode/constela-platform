import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import {
  hashPassword,
  createSession,
  setSessionCookie,
} from "@/lib/auth";
import { registerSchema } from "@constela/validators/auth";
import type { UserRole } from "@constela/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, accountType } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Get or create default tenant for practitioners
    let tenantId: string | null = null;
    if (accountType === "PRACTITIONER") {
      // Create a new tenant for the practitioner
      const tenant = await prisma.tenant.create({
        data: {
          name: `${name} - Practice`,
          slug: normalizedEmail.split("@")[0]?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || `tenant-${Date.now()}`,
        },
      });
      tenantId = tenant.id;
    } else {
      // For clients, use default tenant
      const defaultTenant = await prisma.tenant.findFirst({
        where: { slug: "default" },
      });
      tenantId = defaultTenant?.id || null;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Determine role
    const role: UserRole = accountType === "PRACTITIONER" ? "PRACTITIONER" : "CLIENT";

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        role,
        tenantId,
      },
    });

    // Create corresponding profile
    if (accountType === "PRACTITIONER") {
      await prisma.practitionerProfile.create({
        data: {
          userId: user.id,
          sessionDuration: 60, // Default 60 minutes
        },
      });
    } else {
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        tenantId,
        action: "REGISTER",
        entityType: "User",
        entityId: user.id,
        payload: { accountType },
      },
    });

    // Create session
    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
