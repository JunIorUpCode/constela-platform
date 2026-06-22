// ==============================================
// Session Types
// ==============================================

export enum SessionType {
  INDIVIDUAL = "INDIVIDUAL",
  GROUP_CLOSED = "GROUP_CLOSED",
  GROUP_WITH_OBSERVERS = "GROUP_WITH_OBSERVERS",
  DEMONSTRATION = "DEMONSTRATION",
}

export enum SessionStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  PAID = "PAID",
  READY = "READY",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  NO_SHOW = "NO_SHOW",
}

export enum ParticipantRole {
  CLIENT = "CLIENT",
  REPRESENTATIVE = "REPRESENTATIVE",
  OBSERVER = "OBSERVER",
  GUEST = "GUEST",
}

export interface Session {
  id: string;
  tenantId: string;
  practitionerId: string;
  title: string;
  type: SessionType;
  status: SessionStatus;
  startsAt: Date;
  endsAt: Date;
  priceCents: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  role: ParticipantRole;
  canMoveElements: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
  createdAt: Date;
}

export interface AvailabilityRule {
  id: string;
  practitionerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AvailabilityBlock {
  id: string;
  practitionerId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
}
