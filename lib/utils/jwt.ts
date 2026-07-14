import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE_NAME } from "../api/auth";

export type JwtGatewaySession = {
  userId: string;
  tenantId: string;
  role: string;
  allowedSolutions: string[];
  email?: string;
  name?: string;
  exp?: number;
};

type JwtPayloadRaw = {
  userId?: string;
  sub?: string;
  id?: string;
  tenantId?: string;
  tenant_id?: string;
  tenant?: {
    id?: string;
  };
  role?: string;
  userRole?: string;
  roles?: string[];
  allowedSolutions?: string[];
  portals?: string[];
  solutions?: string[];
  email?: string;
  name?: string;
  exp?: number;
  [key: string]: unknown;
};

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function decodeJwtPayload(token: string): JwtGatewaySession {
  const parts = token.split(".");

  if (parts.length < 2) {
    throw new Error("Format JWT tidak valid.");
  }

  const payloadText = decodeBase64Url(parts[1]);
  const payload = JSON.parse(payloadText) as JwtPayloadRaw;

  const userId = payload.userId ?? payload.sub ?? payload.id;
  const tenantId = payload.tenantId ?? payload.tenant_id ?? payload.tenant?.id;
  const role = payload.role ?? payload.userRole ?? (Array.isArray(payload.roles) ? payload.roles[0] : undefined);
  const allowedSolutionsCandidates = [
    normalizeStringArray(payload.allowedSolutions),
    normalizeStringArray(payload.portals),
    normalizeStringArray(payload.solutions)
  ];
  const allowedSolutions = allowedSolutionsCandidates.find((items) => items.length > 0) ?? [];

  if (!userId || !tenantId) {
    throw new Error("Payload JWT tidak lengkap.");
  }

  return {
    userId,
    tenantId,
    role: role ?? "TENANT_ADMIN",
    allowedSolutions,
    email: payload.email,
    name: payload.name,
    exp: payload.exp
  };
}

export async function getCurrentSession(): Promise<JwtGatewaySession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const session = decodeJwtPayload(token);

    if (typeof session.exp === "number") {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (session.exp <= nowInSeconds) {
        return null;
      }
    }

    return session;
  } catch {
    return null;
  }
}
