"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Gauge,
  Home,
  Navigation,
  Phone,
  Truck,
  User,
  UserCircle2
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  buildPhoneCallUrl,
  getDriverCompanyMeta
} from "../../lib/driver-demo-data";

export type DriverShellNextStudent = {
  studentName: string;
  gradeLevel: string;
  className: string;
  distanceKm: number;
  homeAddress: string;
  parentName: string;
  parentPhone: string;
  homeLatitude: number;
  homeLongitude: number;
} | null;

type DriverShellProps = {
  companySlug: string;
  title: string;
  description: string;
  nextStudent?: DriverShellNextStudent;
  children: ReactNode;
};

function extractBreadcrumbs(pathname: string, companySlug: string) {
  const basePath = `/school-erp/driver/${encodeURIComponent(companySlug)}`;
  const currentPath = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : "";
  const segments = currentPath.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    route: "Detail Rute",
    history: "Riwayat Antar"
  };

  return [
    { label: "Aplikasi Driver", href: basePath },
    ...segments.map((segment, index) => ({
      label: labels[segment] ?? segment,
      href: `${basePath}/${segments.slice(0, index + 1).join("/")}`
    }))
  ];
}

export function DriverShell({ companySlug, title, description, nextStudent, children }: DriverShellProps) {
  const pathname = usePathname();
  const meta = getDriverCompanyMeta(companySlug);
  const breadcrumbs = extractBreadcrumbs(pathname, companySlug);
  const isLandingPathname =
    pathname === `/school-erp/driver/${companySlug}` ||
    pathname === `/school-erp/driver/${companySlug}/`;
  const heroStyle = {
    background: `radial-gradient(circle at top left, ${meta.primaryColor}22, transparent 28%), linear-gradient(180deg, #f5fbf7 0%, #f1f7f4 48%, #e8f1ec 100%)`
  };
  const summary = meta.stats;
  const mapsUrl = nextStudent
    ? buildGoogleMapsUrl(
        nextStudent.homeLatitude,
        nextStudent.homeLongitude,
        `${nextStudent.studentName} - ${nextStudent.homeAddress}`
      )
    : "#";
  const phoneUrl = nextStudent ? buildPhoneCallUrl(nextStudent.parentPhone) : "#";
  const distanceLabel = nextStudent
    ? nextStudent.distanceKm < 1
      ? `${Math.round(nextStudent.distanceKm * 1000)} m`
      : `${nextStudent.distanceKm.toFixed(1).replace(".", ",")} km`
    : null;

  return (
    <main className="min-h-screen text-slate-900" style={heroStyle}>
      <style>{`
        @keyframes driver-nav-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(3px, -3px) rotate(-18deg); }
          50% { transform: translate(6px, -4px) rotate(0deg); }
          75% { transform: translate(3px, -3px) rotate(18deg); }
        }
        @keyframes driver-btn-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6), 0 10px 22px -4px rgba(16, 185, 129, 0.5);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 16px rgba(16, 185, 129, 0), 0 14px 28px -2px rgba(16, 185, 129, 0.7);
            transform: scale(1.035);
          }
        }
        @keyframes driver-phone-btn-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0.2); transform: scale(1.02); }
        }
        @keyframes driver-led-dot {
          0%, 100% { opacity: 0.15; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(2.4); box-shadow: 0 0 24px 6px rgba(52, 211, 153, 0.95); }
        }
        @keyframes driver-entrance {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes driver-subtle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes driver-distance-pop {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.25); }
          50% { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }
        @keyframes driver-underline-sweep {
          0%, 100% { opacity: 0; transform: scaleX(0); transform-origin: right; }
          50% { opacity: 1; transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section
          className="overflow-hidden rounded-[32px] border border-white/10 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.6)]"
          style={{ backgroundColor: meta.secondaryColor }}
        >
          <div className="space-y-5 px-5 py-6 sm:px-7 lg:px-9 lg:py-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                  <Truck className="h-3.5 w-3.5" />
                  Dashboard Antar Jemput
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">{summary.shiftLabel}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">Plat {summary.vehiclePlat}</span>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Ringkasan Perjalanan</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Di Mobil</p>
                <p className="mt-2 flex items-baseline gap-2 text-2xl font-semibold text-white">
                  {summary.onCarCount}
                  <span className="text-xs font-medium text-slate-400">/ {summary.totalStudents} siswa</span>
                </p>
                <p className="mt-1 text-xs text-slate-300">{summary.deliveredCount} sudah diantar</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Sisa Jarak</p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                  <Gauge className="h-5 w-5 text-emerald-400" />
                  {summary.remainingDistanceKm.toLocaleString("id-ID")} km
                </p>
                <p className="mt-1 text-xs text-slate-300">Rute diurut berdasarkan jarak terdekat</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Estimasi Selesai</p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                  <Clock className="h-5 w-5 text-amber-400" />
                  {summary.etaMinutes} menit
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    Satu arah, pulang sekolah
                  </span>
                </p>
              </div>
            </div>

            {nextStudent && distanceLabel ? (
              <div
                className="relative overflow-hidden rounded-[20px] border border-emerald-500/30 bg-gradient-to-br from-emerald-600/22 via-emerald-500/10 to-emerald-950/40 p-5 sm:p-6 ring-1 ring-emerald-400/15"
                style={{
                  backdropFilter: "blur(6px)",
                  animation: "driver-entrance 0.6s ease-out both",
                }}
              >
                <div className="flex items-start justify-between gap-3 sm:items-center">
                  <div className="space-y-0.5">
                    <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-300">
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 rounded-full bg-emerald-400"
                        style={{ animation: "driver-led-dot 0.9s ease-in-out infinite" }}
                      />
                      Tujuan Berikutnya
                    </p>
                    <p className="mt-1 text-xs text-slate-300">{meta.schoolName} · {summary.driverName}</p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/20"
                    style={{ animation: "driver-distance-pop 1.6s ease-in-out infinite" }}
                  >
                    <Navigation
                      className="h-3.5 w-3.5 text-emerald-300"
                      style={{ animation: "driver-nav-float 1.3s ease-in-out infinite" }}
                    />
                    {distanceLabel}
                  </span>
                </div>

                <div
                  className="mt-4 flex flex-wrap items-end justify-between gap-4"
                  style={{ animation: "driver-entrance 0.6s 0.08s ease-out both" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2 text-xl font-bold text-white sm:text-2xl">
                      <User
                        className="h-5 w-5 flex-shrink-0 text-emerald-300"
                        style={{ animation: "driver-subtle-bounce 2.2s ease-in-out infinite" }}
                      />
                      {nextStudent.studentName}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-200/95">
                      {nextStudent.gradeLevel} · {nextStudent.className}
                    </p>
                  </div>
                  <div className="flex-shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Jarak dari titik mobil</p>
                    <p
                      className="mt-0.5 text-lg font-bold text-emerald-300"
                      style={{ animation: "driver-distance-pop 2.8s 0.2s ease-in-out infinite" }}
                    >
                      {distanceLabel}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-5 grid gap-3 sm:grid-cols-2"
                  style={{ animation: "driver-entrance 0.6s 0.18s ease-out both" }}
                >
                  <div className="space-y-1.5 text-sm text-slate-200">
                    <p className="flex items-start gap-2">
                      <Home className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400/80" />
                      <span className="line-clamp-2 leading-6">{nextStudent.homeAddress}</span>
                    </p>
                  </div>
                  <div
                    className="flex flex-col items-end justify-end gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-slate-100"
                  >
                    <p className="flex w-full items-center justify-end gap-2">
                      <UserCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400/80" />
                      <span className="text-right leading-5">
                        <span className="mr-1 text-xs text-slate-400">Orang tua:</span>
                        <span className="font-bold text-slate-50">{nextStudent.parentName}</span>
                      </span>
                    </p>
                    <p className="flex w-full items-center justify-end gap-2">
                      <Phone
                        className="h-4 w-4 flex-shrink-0 text-amber-400/90"
                        style={{ animation: "driver-subtle-bounce 1.6s ease-in-out infinite" }}
                      />
                      <a
                        href={phoneUrl}
                        className="text-right font-bold text-slate-50 leading-5 underline-offset-4 transition hover:text-amber-300 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {nextStudent.parentPhone}
                      </a>
                    </p>
                  </div>
                </div>

                <div
                  className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
                  style={{ animation: "driver-entrance 0.6s 0.28s ease-out both" }}
                >
                  <a
                    href={phoneUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:border-amber-400/60 hover:bg-amber-500/15 hover:text-amber-200 sm:w-auto sm:flex-none"
                    style={{ animation: "driver-phone-btn-pulse 2.6s 0.4s ease-in-out infinite" }}
                  >
                    <Phone className="h-4 w-4" />
                    Telepon Orang Tua
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 sm:flex-none sm:min-w-[200px]"
                    style={{ animation: "driver-btn-pulse 2s ease-out infinite" }}
                  >
                    <Navigation className="h-4 w-4" />
                    Navigasi Buka Maps
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="min-w-0 space-y-4">
            {!isLandingPathname ? (
              <Link
                href={`/school-erp/driver/${encodeURIComponent(companySlug)}`}
                className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white transition group-hover:bg-emerald-400 group-hover:text-slate-900">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
                Kembali ke Dashboard Driver
              </Link>
            ) : null}

            <div className="rounded-[24px] border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.href} className="inline-flex items-center gap-1.5">
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-slate-800">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="transition hover:text-slate-800">
                        {crumb.label}
                      </Link>
                    )}
                    {index < breadcrumbs.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                  </span>
                ))}
              </div>
            </div>

            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
