"use server";

import { getCurrentSession } from "../../lib/utils/jwt";

type ProxyPayload = Record<string, unknown>;

type ProxyResult<T> = {
  success: boolean;
  message?: string;
  data: T;
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

async function requestCampus<T>(path: string, init: RequestInit): Promise<T> {
  const session = await getCurrentSession();

  if (!session?.tenantId || !session?.userId) {
    throw new Error("Sesi tenant tidak valid.");
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
  let payload: ProxyPayload | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ProxyPayload;
    } catch {
      payload = { message: rawText };
    }
  }

  if (!response.ok) {
    throw new Error((payload?.message as string | undefined) ?? `Request gagal (${response.status})`);
  }

  const dataCandidates = [
    payload,
    payload?.data,
    payload?.employees,
    payload?.classrooms,
    payload?.subjects
  ];

  const data = dataCandidates.find((item) => item !== undefined) as T;

  return data;
}

export async function getEmployees() {
  return requestCampus<unknown[]>("/api/employees", { method: "GET" });
}

export async function createEmployee(payload: ProxyPayload): Promise<ProxyResult<null>> {
  await requestCampus<unknown>("/api/employees", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return { success: true, data: null };
}

export async function getClassrooms() {
  return requestCampus<unknown[]>("/api/classrooms", { method: "GET" });
}

export async function createClassroom(payload: ProxyPayload): Promise<ProxyResult<null>> {
  await requestCampus<unknown>("/api/classrooms", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return { success: true, data: null };
}

export async function getSubjects() {
  return requestCampus<unknown[]>("/api/subjects", { method: "GET" });
}

export async function createSubject(payload: ProxyPayload): Promise<ProxyResult<null>> {
  await requestCampus<unknown>("/api/subjects", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return { success: true, data: null };
}
