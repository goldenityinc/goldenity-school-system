"use server";

import { getCurrentSession } from "../../lib/utils/jwt";

type ProxyPayload = Record<string, unknown>;

type ProxyResult<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      data: T;
      error: string;
      message?: string;
      status?: number;
      errors?: Record<string, string>;
    };

const DEFAULT_BACKEND_URL =
  process.env.CAMPUS_API_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? "https://goldenity-campus-website.vercel.app";

function buildBackendUrl(path: string) {
  return `${DEFAULT_BACKEND_URL.replace(/\/$/, "")}${path}`;
}

function normalizeRole(role?: string | null) {
  const normalized = (role ?? "").toUpperCase();

  if (["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "STAFF"].includes(normalized)) return "admin";
  if (["GURU", "TEACHER", "LECTURER", "DOSEN"].includes(normalized)) return "dosen";
  if (["MAHASISWA", "STUDENT", "MURID", "SISWA"].includes(normalized)) return "mahasiswa";
  return "admin";
}

function safeParseJson(rawText: string) {
  try {
    return JSON.parse(rawText) as ProxyPayload;
  } catch {
    return null;
  }
}

function extractData<T>(payload: ProxyPayload | null, fallbackData: T) {
  if (!payload) {
    return fallbackData;
  }

  const dataCandidates = [
    payload.data,
    payload.employees,
    payload.classrooms,
    payload.subjects,
    payload
  ];

  const picked = dataCandidates.find((item) => item !== undefined && item !== null);
  return (picked ?? fallbackData) as T;
}

async function requestCampus<T>(path: string, init: RequestInit, fallbackData: T): Promise<ProxyResult<T>> {
  try {
    const session = await getCurrentSession();

    if (!session?.tenantId || !session?.userId) {
      return {
        success: false,
        data: fallbackData,
        error: "Sesi tenant tidak valid."
      };
    }

    const response = await fetch(buildBackendUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": session.tenantId,
        "x-user-id": session.userId,
        "x-role": normalizeRole(session.role),
        Authorization: session.token ? `Bearer ${session.token}` : "",
        ...(init.headers ?? {})
      },
      cache: "no-store"
    });

    const rawText = await response.text();
    const contentType = response.headers.get("content-type") ?? "";

    let payload: ProxyPayload | null = null;

    if (rawText) {
      if (contentType.toLowerCase().includes("application/json")) {
        payload = safeParseJson(rawText);
      } else {
        // Non-JSON backend responses (HTML/plain text) should never crash server actions.
        payload = { message: rawText };
      }
    }

    const parsedErrors = payload?.errors;
    const normalizedErrors =
      parsedErrors && typeof parsedErrors === "object"
        ? (Object.fromEntries(
            Object.entries(parsedErrors).filter((entry): entry is [string, string] => typeof entry[1] === "string")
          ) as Record<string, string>)
        : undefined;

    if (!response.ok) {
      return {
        success: false,
        data: fallbackData,
        error: (payload?.message as string | undefined) ?? `Request gagal (${response.status})`,
        message: payload?.message as string | undefined,
        status: response.status,
        errors: normalizedErrors
      };
    }

    return {
      success: true,
      data: extractData(payload, fallbackData),
      message: payload?.message as string | undefined
    };
  } catch (error) {
    console.error("SERVER ACTION EXCEPTION:", error);
    return {
      success: false,
      data: fallbackData,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat menghubungi backend akademik."
    };
  }
}

export async function getEmployees() {
  return requestCampus<unknown[]>("/api/employees", { method: "GET" }, []);
}

export async function createEmployee(payload: ProxyPayload): Promise<ProxyResult<null>> {
  return requestCampus<null>(
    "/api/employees",
    {
    method: "POST",
    body: JSON.stringify(payload)
    },
    null
  );
}

export async function getClassrooms() {
  return requestCampus<unknown[]>("/api/classrooms", { method: "GET" }, []);
}

export async function createClassroom(payload: ProxyPayload): Promise<ProxyResult<null>> {
  return requestCampus<null>(
    "/api/classrooms",
    {
    method: "POST",
    body: JSON.stringify(payload)
    },
    null
  );
}

export async function getSubjects() {
  return requestCampus<unknown[]>("/api/subjects", { method: "GET" }, []);
}

export async function createSubject(payload: ProxyPayload): Promise<ProxyResult<null>> {
  return requestCampus<null>(
    "/api/subjects",
    {
    method: "POST",
    body: JSON.stringify(payload)
    },
    null
  );
}
