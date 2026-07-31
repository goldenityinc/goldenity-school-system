"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Truck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [manualTenantSlug, setManualTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const presetTenantSlug = useMemo(() => {
    const fromQuery = searchParams.get("tenantSlug");
    if (fromQuery?.trim()) {
      return fromQuery.trim();
    }

    const pathMatch = pathname.match(/^\/school-erp\/([^/]+)\/login\/?$/);
    const fromPath = pathMatch ? decodeURIComponent(pathMatch[1] ?? "") : "";
    if (fromPath.trim()) {
      return fromPath.trim();
    }

    if (typeof document !== "undefined") {
      const cookieValue = document.cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("goldenity_school_active_tenant_slug="))
        ?.split("=")[1];
      const decoded = cookieValue ? decodeURIComponent(cookieValue) : "";
      if (decoded.trim()) {
        return decoded.trim();
      }
    }

    return "";
  }, [pathname, searchParams]);
  const tenantSlug = presetTenantSlug || manualTenantSlug.trim();

  useEffect(() => {
    let isActive = true;

    async function checkSession() {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store"
      });

      if (!isActive) {
        return;
      }

      if (!response.ok) {
        return;
      }

      const payload = (await response.json().catch(() => null)) as { authenticated?: boolean } | null;

      if (payload?.authenticated) {
        router.replace("/");
      }
    }

    void checkSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  const isTenantPreset = Boolean(presetTenantSlug);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tenantSlug, email, password }),
        signal: controller.signal
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setErrorMessage(payload?.message ?? "Username atau password tidak valid.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setErrorMessage("Request login timeout. Silakan coba lagi.");
      } else {
        setErrorMessage("Terjadi kendala koneksi saat login. Coba beberapa saat lagi.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Masuk ke EduCore</h1>
          <p className="mt-2 text-sm text-slate-600">Masuk untuk mengakses dashboard sekolah.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
          {!isTenantPreset ? (
            <div>
              <label htmlFor="tenantSlug" className="mb-1 block text-sm font-medium text-slate-700">
                Slug Tenant
              </label>
              <input
                id="tenantSlug"
                name="tenantSlug"
                type="text"
                value={tenantSlug}
                onChange={(event) => setManualTenantSlug(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
                placeholder="Masukkan slug tenant"
                autoComplete="off"
                required
              />
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Tenant: <span className="font-semibold text-slate-900">{tenantSlug}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Nama Pengguna
            </label>
            <input
              id="email"
              name="email"
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
              placeholder="Masukkan nama pengguna"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Kata Sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none ring-yellow-500 focus:ring-2"
              placeholder="Masukkan kata sandi"
              autoComplete="new-password"
              required
            />
          </div>

          {errorMessage ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg bg-slate-900 px-4 font-semibold text-yellow-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="mb-4">
            <p className="text-center text-sm font-semibold text-slate-700">
              Jelajahi Demo Aplikasi Goldenity EduCore
            </p>
            <p className="mt-1 text-center text-xs text-slate-500">
              Pilih salah satu aplikasi demo untuk melihat tampilan langsung
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href={`/school-erp/psb/${encodeURIComponent(presetTenantSlug || tenantSlug || "company-1")}`}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/30 transition group-hover:scale-110">
                <BookOpen className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-slate-800">Sistem PSB</p>
              <p className="text-[10px] font-medium text-slate-500">Penerimaan Siswa Baru</p>
            </Link>

            <Link
              href={`/school-erp/teacher/${encodeURIComponent(presetTenantSlug || tenantSlug || "company-1")}`}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30 transition group-hover:scale-110">
                <GraduationCap className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-slate-800">Aplikasi Guru</p>
              <p className="text-[10px] font-medium text-slate-500">Dashboard Wali Kelas</p>
            </Link>

            <Link
              href={`/school-erp/driver/${encodeURIComponent(presetTenantSlug || tenantSlug || "company-1")}`}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 transition group-hover:scale-110">
                <Truck className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-slate-800">Aplikasi Driver</p>
              <p className="text-[10px] font-medium text-slate-500">Antar Jemput Siswa</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
