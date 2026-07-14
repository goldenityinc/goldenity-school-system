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

type CentralCommandErrorResponse = {
  message?: string;
};

const DEFAULT_SCHOOL_SOLUTION = "SCHOOL_ERP";
const DEFAULT_ADMIN_CORE_API_URL = "https://goldenity-admin-core-api.vercel.app";

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as CentralCommandErrorResponse;
    return data.message ?? `Central Command auth failed (${response.status})`;
  } catch {
    return `Central Command auth failed (${response.status})`;
  }
}

export async function verifyLoginWithCentralCommand(
  email: string,
  password: string,
  requestedSolution?: string
): Promise<CentralCommandUser> {
  const baseUrl =
    process.env.CENTRAL_COMMAND_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? DEFAULT_ADMIN_CORE_API_URL;
  const solution = requestedSolution ?? process.env.CENTRAL_COMMAND_SOLUTION ?? DEFAULT_SCHOOL_SOLUTION;

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  const response = await fetch(`${normalizedBaseUrl}/api/v1/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password, solution }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as CentralCommandAuthResponse;

  if (!data?.user) {
    throw new Error("Invalid auth response from Central Command.");
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
