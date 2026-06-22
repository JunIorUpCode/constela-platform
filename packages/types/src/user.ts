// ==============================================
// User Types
// ==============================================

export enum UserRole {
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
  TENANT_ADMIN = "TENANT_ADMIN",
  PRACTITIONER = "PRACTITIONER",
  CLIENT = "CLIENT",
  GUEST = "GUEST",
  OBSERVER = "OBSERVER",
}

export interface User {
  id: string;
  tenantId: string | null;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PractitionerProfile {
  id: string;
  userId: string;
  bio: string | null;
  sessionPrice: number | null;
  sessionDuration: number | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProfile {
  id: string;
  userId: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}
