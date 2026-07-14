export const AUTH_TOKEN_COOKIE_NAME = "goldenity_school_auth_token";

type AdminCoreLoginPayload = {
  email: string;
  password: string;
  solution?: string;
};

type AdminCoreLoginResponse = {
  token?: string;
  accessToken?: string;
  jwt?: string;
};

function resolveAdminCoreBaseUrl() {
  const baseUrl =
    process.env.CENTRAL_COMMAND_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? "https://goldenity-admin-core-api.vercel.app";

  return baseUrl.replace(/\/$/, "");
}

function readTokenFromResponse(data: AdminCoreLoginResponse): string | null {
  const maybeToken = data.token ?? data.accessToken ?? data.jwt;
  return typeof maybeToken === "string" && maybeToken.length > 0 ? maybeToken : null;
}

export async function loginViaAdminCore(payload: AdminCoreLoginPayload): Promise<string> {
  const baseUrl = resolveAdminCoreBaseUrl();
  const loginPayload = {
    email: payload.email,
    password: payload.password,
    solution: process.env.CENTRAL_COMMAND_SOLUTION || "SCHOOL_ERP"
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
