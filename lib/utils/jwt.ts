import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE_NAME } from "../api/auth";

export const AUTH_TENANT_LABEL_COOKIE_NAME = "goldenity_school_tenant_label";

export type JwtGatewaySession = {
  token?: string;
  userId: string;
  tenantId: string;
  role: string;
  allowedSolutions: string[];
  id?: string;
  tenant_id?: string;
  user?: {
    id?: string;
    tenantId?: string;
    tenant_id?: string;
    role?: string;
  };
  email?: string;
  name?: string;
  tenantName?: string;
  image?: string | null;
  profilePhotoUrl?: string | null;
  tenantLogoUrl?: string | null;
  exp?: number;
};

type JwtPayloadRaw = {
  userId?: string;
  sub?: string;
  id?: string;
  user?: {
    id?: string;
    userId?: string;
    tenantId?: string;
    tenant_id?: string;
    role?: string;
  };
  username?: string;
  fullName?: string;
  tenantId?: string;
  tenant_id?: string;
  tenant?: {
    id?: string;
    name?: string;
  };
  tenantName?: string;
  tenant_name?: string;
  companyName?: string;
  company_name?: string;
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

function encodeBase64Url(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function createGatewayToken(payload: JwtPayloadRaw): string {
  const header = {
    alg: "none",
    typ: "JWT"
  };

  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.`;
}

export function decodeJwtPayload(token: string): JwtGatewaySession {
  const parts = token.split(".");

  if (parts.length < 2) {
    throw new Error("Format JWT tidak valid.");
  }

  const payloadText = decodeBase64Url(parts[1]);
  const payload = JSON.parse(payloadText) as JwtPayloadRaw;

  const userId = payload.userId ?? payload.sub ?? payload.id ?? payload.user?.id ?? payload.user?.userId;
  const tenantId = payload.tenantId ?? payload.tenant_id ?? payload.tenant?.id ?? payload.user?.tenantId ?? payload.user?.tenant_id;
  const role = payload.role ?? payload.userRole ?? payload.user?.role ?? (Array.isArray(payload.roles) ? payload.roles[0] : undefined);
  const allowedSolutionsCandidates = [
    normalizeStringArray(payload.allowedSolutions),
    normalizeStringArray(payload.portals),
    normalizeStringArray(payload.solutions)
  ];
  const allowedSolutions = allowedSolutionsCandidates.find((items) => items.length > 0) ?? [];
  const tenantName =
    payload.tenantName ??
    payload.tenant_name ??
    payload.companyName ??
    payload.company_name ??
    payload.tenant?.name ??
    undefined;

  if (!userId || !tenantId) {
    throw new Error("Payload JWT tidak lengkap.");
  }

  return {
    userId,
    tenantId,
    id: userId,
    tenant_id: tenantId,
    role: role ?? "TENANT_ADMIN",
    allowedSolutions,
    user: {
      id: userId,
      tenantId,
      tenant_id: tenantId,
      role: role ?? "TENANT_ADMIN"
    },
    email: payload.email,
    name: payload.name ?? payload.fullName ?? payload.username ?? payload.email ?? undefined,
    tenantName,
    exp: payload.exp
  };
}

export async function getCurrentSession(): Promise<JwtGatewaySession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  const tenantLabelFromCookie = cookieStore.get(AUTH_TENANT_LABEL_COOKIE_NAME)?.value;

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
    return {
      ...session,
      token,
      name: session.name,
      tenantName: session.tenantName ?? tenantLabelFromCookie ?? undefined,
      image: session.image ?? null,
      profilePhotoUrl: session.profilePhotoUrl ?? null,
      tenantLogoUrl: session.tenantLogoUrl ?? null,
      user: session.user ?? {
        id: session.userId,
        tenantId: session.tenantId,
        tenant_id: session.tenantId,
        role: session.role
      }
    };
  } catch {
    return null;
  }
}
