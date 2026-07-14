export const AUTH_TOKEN_COOKIE_NAME = "goldenity_school_auth_token";

type AdminCoreLoginPayload = {
  email: string;
  password: string;
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
  const loginPayload = {
    email: payload.email,
    password: payload.password,
    solution: payload.solution ?? (process.env.CENTRAL_COMMAND_SOLUTION || "SCHOOL_ERP")
  };

  console.log("LOGIN PAYLOAD:", loginPayload);

  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(loginPayload),
    cache: "no-store"
  });

  if (!response.ok) {
    let message = "Email atau password tidak valid.";
    let errorData: unknown = null;

    try {
      const errorJson = (await response.json()) as { message?: string };
      errorData = errorJson;
      console.error("LOGIN FAILED FROM BACKEND:", errorData);

      if (typeof errorJson.message === "string" && errorJson.message.trim().length > 0) {
        message = errorJson.message;
      }
    } catch {
      console.error("LOGIN FAILED FROM BACKEND:", { status: response.status, message: "Non-JSON error response" });
      // Use fallback message when backend body is not JSON.
    }

    throw new Error(message);
  }

  const data = (await response.json()) as AdminCoreLoginResponse;
  const token = readTokenFromResponse(data);

  if (!token) {
    throw new Error("Token login tidak ditemukan pada respons Admin Core.");
  }

  return token;
}
