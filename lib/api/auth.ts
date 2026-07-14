export const AUTH_TOKEN_COOKIE_NAME = "goldenity_school_auth_token";

export class AdminCoreAuthError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "AdminCoreAuthError";
    this.status = status;
    this.details = details;
  }
}

type AdminCoreLoginPayload = {
  email: string;
  password: string;
  tenantSlug?: string;
  solution?: string;
};

type AdminCoreLoginResponse = {
  token?: string;
  accessToken?: string;
  access_token?: string;
  jwt?: string;
  data?: {
    token?: string;
    accessToken?: string;
    access_token?: string;
    jwt?: string;
  };
  result?: {
    token?: string;
    accessToken?: string;
    access_token?: string;
    jwt?: string;
  };
};

function resolveAdminCoreBaseUrl() {
  const baseUrl =
    process.env.CENTRAL_COMMAND_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? "https://goldenity-admin-core-api.vercel.app";

  return baseUrl.replace(/\/$/, "");
}

function readTokenFromResponse(data: AdminCoreLoginResponse): string | null {
  const candidates = [
    data.token,
    data.accessToken,
    data.access_token,
    data.jwt,
    data.data?.token,
    data.data?.accessToken,
    data.data?.access_token,
    data.data?.jwt,
    data.result?.token,
    data.result?.accessToken,
    data.result?.access_token,
    data.result?.jwt
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

export async function loginViaAdminCore(payload: AdminCoreLoginPayload): Promise<string> {
  const baseUrl = resolveAdminCoreBaseUrl();
  const tenantSlug = payload.tenantSlug?.trim() || process.env.CENTRAL_COMMAND_TENANT_SLUG || process.env.NEXT_PUBLIC_TENANT_SLUG || undefined;
  const loginIdentifier = payload.email.trim();
  const loginPayload = {
    // Admin Core login contract expects `username`; keep `email` for backward compatibility.
    username: loginIdentifier,
    email: loginIdentifier,
    password: payload.password,
    solution: payload.solution ?? (process.env.CENTRAL_COMMAND_SOLUTION || "SCHOOL_ERP"),
    tenantSlug,
    tenant_slug: tenantSlug,
    kode_perusahaan: tenantSlug
  };

  console.log("LOGIN PAYLOAD:", loginPayload);
  const loginEndpoints = ["/auth/login", "/api/v1/auth/login"];
  let response: Response | null = null;

  for (const endpoint of loginEndpoints) {
    const attempt = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginPayload),
      cache: "no-store"
    });

    response = attempt;

    // Try fallback endpoint only when route is not available.
    if ((attempt.status === 404 || attempt.status === 405) && endpoint !== loginEndpoints[loginEndpoints.length - 1]) {
      continue;
    }

    break;
  }

  if (!response) {
    throw new AdminCoreAuthError("Gagal menghubungi layanan autentikasi Admin Core.", 503);
  }

  if (!response.ok) {
    let message = "Email atau password tidak valid.";
    let errorData: unknown = null;

    try {
      const errorJson = (await response.json()) as { message?: string; error?: string; details?: unknown };
      errorData = errorJson;
      console.error("LOGIN FAILED FROM BACKEND:", errorData);

      if (typeof errorJson.message === "string" && errorJson.message.trim().length > 0) {
        message = errorJson.message;
      } else if (typeof errorJson.error === "string" && errorJson.error.trim().length > 0) {
        message = errorJson.error;
      }
    } catch {
      const textBody = await response.text().catch(() => "");
      errorData = textBody || null;
      console.error("LOGIN FAILED FROM BACKEND:", {
        status: response.status,
        message: "Non-JSON error response",
        body: textBody
      });

      if (textBody.trim().length > 0) {
        message = textBody;
      } else if (response.status === 401) {
        message = "Login ditolak Admin Core. Periksa tenant slug, username, password, dan akses solusi SCHOOL_ERP.";
      }
    }

    if (response.status === 400 && !tenantSlug) {
      message = "Konfigurasi tenant belum lengkap. Set env CENTRAL_COMMAND_TENANT_SLUG di deployment School ERP.";
    }

    throw new AdminCoreAuthError(message, response.status, errorData);
  }

  const data = (await response.json()) as AdminCoreLoginResponse;
  const token = readTokenFromResponse(data);

  if (!token) {
    throw new Error("Token login tidak ditemukan pada respons Admin Core.");
  }

  return token;
}
