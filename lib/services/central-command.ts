type CentralCommandUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  activeModules: string[];
};

export type CentralCommandAuthResponse = {
  success: boolean;
  message?: string;
  user: CentralCommandUser;
};

type VerifyPayload = {
  email: string;
  password: string;
  requestedSolution?: string;
  tenantSlug?: string;
};

type CentralCommandErrorResponse = {
  message?: string;
};

const DEFAULT_SCHOOL_SOLUTION = "SCHOOL_ERP";
const DEFAULT_ADMIN_CORE_API_URL = "https://goldenity-admin-core-api.vercel.app";

function resolveAdminCoreBaseUrls() {
  const values: Array<string | undefined> = [
    process.env.CENTRAL_COMMAND_URL,
    process.env.GOLDENITY_ADMIN_CORE_API_URL
  ];

  if (process.env.NODE_ENV !== "production") {
    values.push("http://127.0.0.1:5001");
    values.push("http://localhost:5001");
  }

  values.push(DEFAULT_ADMIN_CORE_API_URL);

  const normalized = values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().replace(/\/+$/, ""))
    .map((value) => value.replace(/\/api(?:\/v\d+)?$/i, ""));

  return Array.from(new Set(normalized.filter((value) => value.length > 0)));
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as CentralCommandErrorResponse;
    return data.message ?? `Central Command auth failed (${response.status})`;
  } catch {
    return `Central Command auth failed (${response.status})`;
  }
}

export async function verifyLoginWithCentralCommand(
  payload: VerifyPayload
): Promise<CentralCommandUser> {
  const solution = payload.requestedSolution ?? process.env.CENTRAL_COMMAND_SOLUTION ?? DEFAULT_SCHOOL_SOLUTION;
  const baseUrls = resolveAdminCoreBaseUrls();
  let lastErrorMessage = "Gagal terhubung ke layanan verifikasi login.";

  for (const baseUrl of baseUrls) {
    let response: Response;

    try {
      response = await fetch(`${baseUrl}/api/v1/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: payload.email,
          username: payload.email,
          password: payload.password,
          solution,
          tenantSlug: payload.tenantSlug,
          tenant_slug: payload.tenantSlug,
          kode_perusahaan: payload.tenantSlug
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });
    } catch {
      continue;
    }

    if (!response.ok) {
      lastErrorMessage = await readErrorMessage(response);
      continue;
    }

    const data = (await response.json()) as CentralCommandAuthResponse;

    if (!data?.user) {
      lastErrorMessage = "Invalid auth response from Central Command.";
      continue;
    }

    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      tenantId: data.user.tenantId ?? null,
      activeModules: Array.isArray(data.user.activeModules) ? data.user.activeModules : []
    };
  }

  throw new Error(lastErrorMessage);
}
