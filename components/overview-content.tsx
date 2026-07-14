"use client";

import { useEffect, useMemo, useState } from "react";
import { getDashboardStats, getRecentStudents } from "../app/actions/dashboard";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useTenant } from "./tenant-context";

type DashboardStats = {
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
};

type RecentStudent = {
  id: string;
  fullName: string;
  studentNumber: string;
  email: string | null;
  createdAt: string;
  enrollments: Array<{
    id: string;
    status: string;
    courseOffering: {
      term: string;
      academicYear: string;
      section: string | null;
      course: { name: string; code: string };
      lecturer: { fullName: string } | null;
    };
    grade: {
      score: string | null;
      letter: string | null;
      remarks: string | null;
    } | null;
  }>;
};

type Stat = {
  label: string;
  value: string;
  delta: string;
  deltaTone: "positive" | "warning" | "neutral";
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function StatCard({ stat }: { stat: Stat }) {
  const toneClass = stat.deltaTone === "positive" ? "text-green-600" : stat.deltaTone === "warning" ? "text-amber-600" : "text-slate-500";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{stat.label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
      <p className={`mt-1 text-xs font-medium ${toneClass}`}>{stat.delta}</p>
    </article>
  );
}

function StudentTable({ students }: { students: RecentStudent[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft" aria-labelledby="student-table-title">
      <div className="flex flex-wrap items-center justify-between gap-3 p-2">
        <h3 id="student-table-title" className="text-base font-semibold text-slate-900">Murid Terbaru</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Cari murid"
            type="search"
            placeholder="Cari murid"
            className="h-9 rounded-md border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
          />
          <Button variant="outline" size="sm">Ekspor</Button>
          <Button variant="primary" size="sm">Tambah Murid</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="border-y border-slate-200 px-3 py-2">Student</th>
              <th className="border-y border-slate-200 px-3 py-2">Enrollment</th>
              <th className="border-y border-slate-200 px-3 py-2">Course</th>
              <th className="border-y border-slate-200 px-3 py-2">Grade</th>
              <th className="border-y border-slate-200 px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const latestEnrollment = student.enrollments[0];
              const courseName = latestEnrollment?.courseOffering.course.name ?? "-";
              const gradeLabel = latestEnrollment?.grade?.letter ?? latestEnrollment?.grade?.score ?? "-";

              return (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-3 py-3">
                    <div className="font-medium text-slate-900">{student.fullName}</div>
                    <div className="text-xs text-slate-500">{student.studentNumber}</div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{formatDate(student.createdAt)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-600">
                    <div className="font-medium text-slate-900">{courseName}</div>
                    <div className="text-xs text-slate-500">{latestEnrollment?.courseOffering.term ?? "-"} {latestEnrollment?.courseOffering.academicYear ?? ""}</div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-900">{String(gradeLabel)}</td>
                  <td className="border-b border-slate-100 px-3 py-3">
                    <Badge variant={latestEnrollment?.status === "ENROLLED" ? "active" : "inactive"}>{latestEnrollment?.status ?? "N/A"}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OverviewContent() {
  const { selectedTenant } = useTenant();
  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, totalLecturers: 0, totalCourses: 0 });
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const [dashboardStats, students] = await Promise.all([
          getDashboardStats(selectedTenant),
          getRecentStudents(selectedTenant)
        ]);

        if (!isActive) {
          return;
        }

        setStats(dashboardStats);
        setRecentStudents(students as RecentStudent[]);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [selectedTenant]);

  const summaryStats: Stat[] = useMemo(
    () => [
      { label: "Total Murid", value: String(stats.totalStudents), delta: "Data sekolah aktif", deltaTone: "positive" },
      { label: "Total Guru", value: String(stats.totalLecturers), delta: "Tenaga pengajar aktif", deltaTone: "positive" },
      { label: "Total Mapel", value: String(stats.totalCourses), delta: "Mata pelajaran aktif", deltaTone: "positive" }
    ],
    [stats.totalCourses, stats.totalLecturers, stats.totalStudents]
  );

  return (
    <section className="grid gap-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-3">
          <p className="inline-flex w-fit rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
            Dashboard Operasional
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">Ikhtisar Sekolah</h1>
          <p className="max-w-2xl text-sm text-slate-500 sm:text-base">Pantau data operasional sekolah secara real-time.</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="KPI metrics">
        {summaryStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <StudentTable students={recentStudents} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft" aria-labelledby="feature-flags-title">
        <h3 id="feature-flags-title" className="text-base font-semibold text-slate-900">Fitur Tambahan</h3>
        <p className="mt-1 text-sm text-slate-500">Pengaturan kemampuan tambahan untuk sekolah.</p>
        <div className="mt-4 space-y-3">
          <article className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <p className="font-semibold">Absensi Biometrik</p>
              <p className="text-xs text-slate-500">Aktifkan absensi fingerprint dan face ID</p>
            </div>
            <Badge variant="active">Aktif</Badge>
          </article>
          <article className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <p className="font-semibold">Integrasi LMS</p>
              <p className="text-xs text-slate-500">Hubungkan dengan Moodle, Google Classroom, atau Canvas</p>
            </div>
            <Badge variant="active">Aktif</Badge>
          </article>
          <article className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <p className="font-semibold">Mode Multi-Cabang</p>
              <p className="text-xs text-slate-500">Kelola banyak cabang fisik sekolah</p>
            </div>
            <Badge variant="inactive">Nonaktif</Badge>
          </article>
        </div>
      </section>
    </section>
  );
}
