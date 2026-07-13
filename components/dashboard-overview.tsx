"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardMetrics } from "../app/actions/dashboard";

type DashboardOverviewProps = {
  userName: string;
  userRole: string;
  metrics: DashboardMetrics;
};

type SummaryCard = {
  title: string;
  value: string;
  icon: ReactNode;
  accentClass: string;
};

const monthlyPitchData = [
  { month: "Jan", revenue: 12500000 },
  { month: "Feb", revenue: 14300000 },
  { month: "Mar", revenue: 15900000 },
  { month: "Apr", revenue: 17100000 },
  { month: "Mei", revenue: 18400000 },
  { month: "Jun", revenue: 20100000 }
];

function formatCurrencyIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function roleSubtitle(role: string) {
  if (role === "SUPER_ADMIN") {
    return "Pantau performa tenant dan ambil keputusan strategis dengan data real-time.";
  }

  if (role === "TEACHER") {
    return "Lihat performa akademik harian dan jadwal kelas Anda secara terpusat.";
  }

  return "Kelola operasional sekolah dari satu dashboard terpadu.";
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="3" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="3" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2 5a2 2 0 0 1 2-2h6a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4a2 2 0 0 1-2-2z" />
      <path d="M22 5a2 2 0 0 0-2-2h-6a3 3 0 0 0-3 3v15a3 3 0 0 1 3-3h6a2 2 0 0 0 2-2z" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 1v22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7" />
    </svg>
  );
}

export function DashboardOverview({ userName, userRole, metrics }: DashboardOverviewProps) {
  const cards: SummaryCard[] = [
    {
      title: "Total Murid Aktif",
      value: String(metrics.totalActiveStudents),
      icon: <UsersIcon />,
      accentClass: "from-sky-500 to-cyan-500"
    },
    {
      title: "Guru Pengajar",
      value: String(metrics.totalTeachers),
      icon: <UserCheckIcon />,
      accentClass: "from-emerald-500 to-teal-500"
    },
    {
      title: "Total Rombel/Kelas",
      value: String(metrics.totalClassrooms),
      icon: <BookOpenIcon />,
      accentClass: "from-violet-500 to-fuchsia-500"
    },
    {
      title: "Pemasukan Bulan Ini",
      value: formatCurrencyIdr(metrics.totalRevenueThisMonth),
      icon: <DollarIcon />,
      accentClass: "from-amber-500 to-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-sky-200 to-cyan-100 blur-2xl" />
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Dashboard Overview</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Selamat Datang, {userName}!</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{roleSubtitle(userRole)}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{card.title}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white ${card.accentClass}`}>
                {card.icon}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Tren Pemasukan 6 Bulan</h2>
            <p className="text-xs text-slate-500">Data pitch visual</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPitchData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                  formatter={(value) => [formatCurrencyIdr(Number(value)), "Pemasukan"]}
                  contentStyle={{ borderRadius: "12px", borderColor: "#e2e8f0" }}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Jadwal Kelas Hari Ini</h2>
          <div className="mt-4 space-y-3">
            {metrics.todaySchedule.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                Tidak ada jadwal kelas hari ini.
              </p>
            ) : (
              metrics.todaySchedule.map((schedule) => (
                <div key={schedule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{schedule.courseName}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {schedule.startTime ?? "--:--"} - {schedule.endTime ?? "--:--"}
                    {schedule.room ? ` • Ruang ${schedule.room}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Kelas: {schedule.classroomName ?? "Belum ditentukan"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Guru: {schedule.lecturerName ?? "Belum ditentukan"}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
