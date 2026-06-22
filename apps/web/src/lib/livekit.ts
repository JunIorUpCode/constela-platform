import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://localhost:7880";

export type ParticipantRole = "host" | "guest" | "observer";

interface CreateTokenParams {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  role: ParticipantRole;
}

export async function createLiveKitToken(params: CreateTokenParams): Promise<string> {
  const { roomName, participantName, participantIdentity, role } = params;

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
  });

  // Set permissions based on role
  const permissions: Record<ParticipantRole, Record<string, boolean>> = {
    host: {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: true,
      roomRecord: false,
      canUpdateMetadata: true,
    },
    guest: {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: false,
      roomRecord: false,
      canUpdateMetadata: false,
    },
    observer: {
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
      roomAdmin: false,
      roomRecord: false,
      canUpdateMetadata: false,
    },
  };

  at.addGrant({
    roomJoin: true,
    room: roomName,
    ...permissions[role],
  });

  // Token expires in 4 hours
  const token = await at.toJwt();

  return token;
}

export function getLiveKitUrl(): string {
  return LIVEKIT_URL;
}

export function generateRoomName(sessionId: string): string {
  return `session-${sessionId}`;
}
