"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock,
  GraduationCap,
  Home,
  Phone,
  Sparkles,
  User,
  Users
} from "lucide-react";
import {
  buildPhoneCallUrl,
  getTeacherClassInfo,
  getTeacherCompanyMeta,
  getTeacherStudentRecords,
  type TeacherPickupStatus
} from "../../lib/teacher-demo-data";

type TeacherShellProps = {
  params: { companySlug: string };
  children: ReactNode;
  title?: string;
  description?: string;
};

function extractBreadcrumbs(pathname: string, companySlug: string) {
  const basePath = `/school-erp/teacher/${encodeURIComponent(companySlug)}`;
  const currentPath = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : "";
  const segments = currentPath.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    "track-pickup": "Lacak Penjemputan",
    "overdue-report": "Laporan Melebihi Jam",
    "history": "Riwayat Penjemputan"
  };

  return [
    { label: "Aplikasi Guru", href: basePath },
    ...segments.map((segment, index) => ({
      label: labels[segment] ?? segment,
      href: `${basePath}/${segments.slice(0, index + 1).join("/")}`
    }))
  ];
}

export function TeacherShell({
  params,
  children,
  title,
  description
}: TeacherShellProps) {
  const pathname = usePathname() ?? "";
  const slug = decodeURIComponent(params.companySlug);
  const meta = getTeacherCompanyMeta(slug);
  const classInfo = getTeacherClassInfo(slug);
  const basePath = `/school-erp/teacher/${encodeURIComponent(slug)}`;
  const breadcrumbs = extractBreadcrumbs(pathname, slug);

  const pickupSummary = useMemo(() => {
    const rows = getTeacherStudentRecords();
    const countBy = (s: TeacherPickupStatus) => rows.filter((r) => r.pickupStatus === s).length;
    return {
      total: rows.length,
      pickedUp: countBy("Picked Up"),
      waiting: countBy("Waiting"),
      overdue: countBy("Overdue")
    };
  }, []);

  const isLandingPathname = pathname
    .replace(/\/+$/, "")
    .replace(/\/\/+/g, "/")
    .endsWith(`/school-erp/teacher/${encodeURIComponent(slug).replace(/%2F/g, "/")}`);

  const teacherPhoneUrl = buildPhoneCallUrl(classInfo.homeroomTeacherPhone);

  const heroStyle: React.CSSProperties = {
    background:
      "linear-gradient(160deg, rgba(99, 102, 241, 0.09), rgba(220, 38, 38, 0.05) 55%, rgba(248, 250, 252, 1))"
  };

  return (
    <main className="min-h-screen text-slate-900" style={heroStyle}>
      <style>{`
        @keyframes teacher-shimmer-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes teacher-alert-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.18), 0 10px 22px -10px rgba(220, 38, 38, 0.45);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(220, 38, 38, 0), 0 14px 28px -6px rgba(220, 38, 38, 0.7);
          }
        }
        @keyframes teacher-dot-blink {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.6); box-shadow: 0 0 14px 4px rgba(220, 38, 38, 0.85); }
        }
        @keyframes teacher-entrance {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section
          className="overflow-hidden rounded-[30px] border border-white/10 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.55)]"
          style={{ backgroundColor: meta.secondaryColor }}
        >
          <div className="space-y-5 px-5 py-6 sm:px-7 lg:px-9 lg:py-7">
            <div
              className="space-y-5"
              style={{ animation: "teacher-entrance 0.5s 0.05s ease-out both" }}
            >
              <div className="space-y-3">
                <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      Kelas yang Diampu
                    </p>
                    <p className="mt-2 flex items-baseline gap-2 text-xl font-semibold text-white">
                      <GraduationCap className="h-5 w-5 text-indigo-400" />
                      {classInfo.className}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">{classInfo.gradeLevel}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      Jumlah Siswa
                    </p>
                    <p className="mt-2 flex items-baseline gap-2 text-xl font-semibold text-white">
                      <Users className="h-5 w-5 text-fuchsia-400" />
                      {classInfo.totalStudents}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">Total siswa aktif di kelas</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      Wali Kelas
                    </p>
                    <p className="mt-2 flex items-baseline gap-2 text-lg font-semibold text-white">
                      <User className="h-5 w-5 text-amber-400" />
                      {classInfo.homeroomTeacher.split(",")[0]}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-300">
                      <a
                        href={teacherPhoneUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-300 transition hover:text-amber-300"
                      >
                        <Phone className="h-3 w-3" />
                        {classInfo.homeroomTeacherPhone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500/20 via-indigo-500/5 to-fuchsia-500/10 px-5 py-4 text-slate-100">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-200/90">
                    Summary Penjemputan
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-2">
                      <Sparkles className="h-4 w-4 text-emerald-300" />
                      <p className="whitespace-nowrap text-xs font-semibold text-emerald-200">
                        Sudah Dijemput
                      </p>
                      <span className="ml-1 text-xl font-extrabold text-emerald-300">
                        {pickupSummary.pickedUp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3.5 py-2">
                      <Clock className="h-4 w-4 text-amber-300" />
                      <p className="whitespace-nowrap text-xs font-semibold text-amber-200">
                        Menunggu
                      </p>
                      <span className="ml-1 text-xl font-extrabold text-amber-300">
                        {pickupSummary.waiting}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-2">
                      <Clock className="h-4 w-4 text-red-300" />
                      <p className="whitespace-nowrap text-xs font-semibold text-red-200">
                        Melebihi Jam Pulang
                      </p>
                      <span className="ml-1 text-xl font-extrabold text-red-300">
                        {pickupSummary.overdue}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/login"
                className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-700"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white transition group-hover:bg-indigo-500 group-hover:text-white">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
                Kembali ke Halaman Login
              </Link>
            </div>

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
                    {index < breadcrumbs.length - 1 ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : null}
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
