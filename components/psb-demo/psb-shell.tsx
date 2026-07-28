"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { getPsbDemoMeta } from "../../lib/psb-demo-data";

type PsbShellProps = {
  companySlug: string;
  title: string;
  description: string;
  children: ReactNode;
};

function extractBreadcrumbs(pathname: string, companySlug: string) {
  const basePath = `/school-erp/psb/${encodeURIComponent(companySlug)}`;
  const currentPath = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : "";
  const segments = currentPath.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    register: "Pendaftaran",
    "applicant-dashboard": "Dashboard Pendaftar",
    "accepted-dashboard": "Dashboard Daftar Ulang",
    "accepted-students": "Siswa Diterima",
    applicants: "Daftar Pendaftar"
  };

  return [
    { label: "PSB Demo", href: basePath },
    ...segments.map((segment, index) => ({
      label: labels[segment] ?? segment,
      href: `${basePath}/${segments.slice(0, index + 1).join("/")}`
    }))
  ];
}

export function PsbShell({ companySlug, title, description, children }: PsbShellProps) {
  const pathname = usePathname();
  const meta = getPsbDemoMeta(companySlug);
  const breadcrumbs = extractBreadcrumbs(pathname, companySlug);
  const isLandingPathname =
    pathname === `/school-erp/psb/${companySlug}` ||
    pathname === `/school-erp/psb/${companySlug}/`;
  const heroStyle = {
    background: `radial-gradient(circle at top left, ${meta.primaryColor}22, transparent 28%), linear-gradient(180deg, #f8fbff 0%, #f4f7fb 48%, #eef2f7 100%)`
  };

  return (
    <main className="min-h-screen text-slate-900" style={heroStyle}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_22px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.55fr_0.95fr]">
            <div className="space-y-5 px-5 py-6 sm:px-7 lg:px-8 lg:py-8">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1"
                  style={{ backgroundColor: `${meta.primaryColor}12`, color: meta.primaryColor }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Demo Frontend PSB
                </span>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">{meta.periodLabel}</span>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">{meta.waveLabel}</span>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-slate-950 sm:text-[30px]">
                  {title}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
                <p className="max-w-3xl text-xs leading-6 text-slate-500">{meta.tagline}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-700" />
                  {meta.schoolName}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  Demo lokasi verifikasi & daftar ulang tersedia
                </span>
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
                  style={{ borderColor: `${meta.accentColor}33`, backgroundColor: `${meta.accentColor}10`, color: meta.accentColor }}
                >
                  Brand {meta.brandShortName}
                </span>
              </div>
            </div>

            <div
              className="border-t border-slate-200 px-5 py-6 text-slate-50 lg:border-l lg:border-t-0 lg:px-7"
              style={{ backgroundColor: meta.secondaryColor }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Ringkasan Demo</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {meta.stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-300">{stat.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="min-w-0 space-y-4">
            {!isLandingPathname ? (
              <Link
                href={`/school-erp/psb/${encodeURIComponent(companySlug)}`}
                className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-yellow-400 hover:text-yellow-700"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white transition group-hover:bg-yellow-400 group-hover:text-slate-900">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
                Kembali ke Beranda PSB
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
