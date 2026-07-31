"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Home,
  MapPin,
  Phone,
  Sparkles,
  UserCircle2
} from "lucide-react";
import {
  type NearbyPickup,
  type TeacherPickupStatus,
  type TeacherStudentRecord,
  buildPhoneCallUrl,
  getNearbyPickups,
  getPickupStatusLabel,
  getTeacherStudentRecords
} from "../../lib/teacher-demo-data";

function StatusBadge({ status, overdue }: { status: TeacherPickupStatus; overdue: number }) {
  const label = getPickupStatusLabel(status);
  if (status === "Picked Up") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-600/25 bg-emerald-600 px-3 py-1.5 text-[11.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(5,150,105,0.65)] ring-1 ring-emerald-400/30">
        <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
        Sudah Dijemput
      </span>
    );
  }
  if (status === "Overdue") {
    return (
      <span
        className="relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-red-950/30 bg-gradient-to-r from-red-600 via-red-500 to-red-600 px-3 py-1.5 text-[11.5px] font-extrabold uppercase tracking-wide text-white shadow-[0_10px_26px_-8px_rgba(185,28,28,0.95)] ring-2 ring-red-300/60"
        style={{
          backgroundSize: "200% 100%",
          animation:
            "teacher-shimmer-sweep 2.2s linear infinite, teacher-alert-pulse 1.4s ease-in-out infinite"
        }}
      >
        <span
          aria-hidden
          className="inline-flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center rounded-full bg-white"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-red-600"
            style={{ animation: "teacher-dot-blink 0.7s ease-in-out infinite" }}
          />
        </span>
        <span className="leading-tight">Melebihi Jam Pulang · {overdue} menit</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/30 bg-amber-500 px-3 py-1.5 text-[11.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(217,119,6,0.68)] ring-1 ring-amber-300/40">
      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
      Menunggu Penjemput
    </span>
  );
}

export function TeacherNearbyTable() {
  const pickups: NearbyPickup[] = useMemo(() => getNearbyPickups(200), []);

  return (
    <section
      className="space-y-3 rounded-[24px] border border-slate-200/80 bg-white/90 px-4 py-5 shadow-[0_22px_70px_-32px_rgba(15,23,42,0.3)] backdrop-blur sm:px-6"
      style={{ animation: "teacher-entrance 0.55s 0.12s ease-out both" }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Penjemput Dalam Radius 200 Meter
            </h2>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/15">
              {pickups.length} orang
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Berikut adalah orang tua / petugas antar jemput yang sudah berada dalam radius 200 m dari area penjemputan kelas.
          </p>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Penjemput</th>
                <th className="px-4 py-3 font-semibold">Kendaraan</th>
                <th className="px-4 py-3 font-semibold">Siswa yang Dijemput</th>
                <th className="px-4 py-3 font-semibold">Jarak · ETA</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pickups.map((p, idx) => {
                const phone = buildPhoneCallUrl(p.phone);
                const distanceLabel =
                  p.distanceMeters < 1000 ? `${p.distanceMeters} m` : `${p.distanceMeters.toLocaleString("id-ID")} km`;
                return (
                  <tr
                    key={p.id}
                    className="transition hover:bg-emerald-50/40"
                    style={{ animation: `teacher-entrance 0.5s ${0.2 + idx * 0.04}s ease-out both` }}
                  >
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <UserCircle2 className="h-4 w-4 text-indigo-500" />
                        {p.pickupName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{p.pickupRelation}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p className="text-sm">
                        {p.vehicleInfo ?? "-"}
                      </p>
                      {p.vehiclePlat ? (
                        <p className="mt-0.5 text-[11px] font-semibold tracking-wider text-slate-500">
                          Plat {p.vehiclePlat}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {p.studentsInCharge.map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-500/10"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                        <MapPin className="h-3.5 w-3.5" /> {distanceLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Estimasi sampai: {p.etaMinutes} menit
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={phone}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:border-amber-500/60 hover:bg-amber-500/20"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Orang Tua
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

type TabFilter = "all" | TeacherPickupStatus;

export function TeacherStudentTable() {
  const rows: TeacherStudentRecord[] = useMemo(() => getTeacherStudentRecords(), []);
  const [tab, setTab] = useState<TabFilter>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => r.pickupStatus === tab);
  }, [rows, tab]);

  const tabs: { key: TabFilter; label: string; count: number; tone: string }[] = [
    {
      key: "all",
      label: "Semua",
      count: rows.length,
      tone: "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
    },
    {
      key: "Waiting",
      label: "Menunggu",
      count: rows.filter((r) => r.pickupStatus === "Waiting").length,
      tone: "border-amber-400/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15"
    },
    {
      key: "Overdue",
      label: "Melebihi Jam Pulang",
      count: rows.filter((r) => r.pickupStatus === "Overdue").length,
      tone: "border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500/15"
    },
    {
      key: "Picked Up",
      label: "Sudah Dijemput",
      count: rows.filter((r) => r.pickupStatus === "Picked Up").length,
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15"
    }
  ];

  return (
    <section
      className="space-y-3 rounded-[24px] border border-slate-200/80 bg-white/90 px-4 py-5 shadow-[0_22px_70px_-32px_rgba(15,23,42,0.3)] backdrop-blur sm:px-6"
      style={{ animation: "teacher-entrance 0.55s 0.2s ease-out both" }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Daftar Siswa & Status Penjemputan
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Baris dengan warna merah berkilau menandakan siswa sudah melebihi batas jam penjemputan dan perlu segera dihubungi orang tuanya.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-700 ring-1 ring-indigo-500/10 shadow-sm"
                    : t.tone
                }`}
              >
                {t.label}
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-inner">
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <style>{`
          .teacher-overdue-row {
            background-image: linear-gradient(
              110deg,
              rgba(254, 202, 202, 0.55) 0%,
              rgba(254, 226, 226, 0.1) 20%,
              rgba(252, 165, 165, 0.75) 48%,
              rgba(254, 226, 226, 0.1) 80%,
              rgba(254, 202, 202, 0.55) 100%
            );
            background-size: 200% 100%;
            animation:
              teacher-shimmer-sweep 2.6s linear infinite,
              teacher-alert-pulse 1.6s ease-in-out infinite;
            box-shadow:
              inset 0 0 0 2px rgba(220, 38, 38, 0.7),
              0 0 0 1px rgba(239, 68, 68, 0.15);
            border-radius: 14px;
          }
          @supports not selector(:focus-visible) {
            .teacher-overdue-row { outline: 2px solid rgba(220,38,38,0.55); outline-offset: -3px; }
          }
          .teacher-overdue-row td {
            background-color: transparent;
          }
        `}</style>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="w-[40px] px-2 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Siswa</th>
                <th className="px-4 py-3 font-semibold">Orang Tua</th>
                <th className="px-4 py-3 font-semibold">Alamat Rumah</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((r, idx) => {
                const phone = buildPhoneCallUrl(r.parentPhone);
                const isOverdue = r.pickupStatus === "Overdue";
                const isPicked = r.pickupStatus === "Picked Up";
                const isOpen = expanded[r.id];

                const rowBaseTone = isPicked
                  ? "bg-emerald-50/30 hover:bg-emerald-50/50 text-slate-600"
                  : isOverdue
                    ? "teacher-overdue-row"
                    : "bg-white hover:bg-indigo-50/30";

                return (
                  <tr
                    key={r.id}
                    className={`transition ${rowBaseTone}`}
                    style={{ animation: `teacher-entrance 0.5s ${0.25 + idx * 0.04}s ease-out both` }}
                  >
                    <td className="px-2 py-3 align-top">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                          isOverdue
                            ? "bg-red-500 text-white shadow-[0_0_0_2px_rgba(239,68,68,0.25)]"
                            : isPicked
                              ? "bg-emerald-500/15 text-emerald-700"
                              : "bg-indigo-500/15 text-indigo-700"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{r.studentName}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {r.gradeLevel} · {r.className}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            <Clock className="mr-1 inline h-3 w-3" />
                            Jemput {r.expectedPickupLabel}
                            {r.pickupTimeLabel !== "-" && (
                              <>
                                {" · "}
                                <span className="font-semibold text-emerald-700">
                                  dijemput {r.pickupTimeLabel}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                          }
                          aria-label={`Toggle detail ${r.studentName}`}
                          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 sm:hidden"
                        >
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div
                        className={`mt-2 grid gap-1 text-[11px] text-slate-500 sm:hidden ${
                          isOpen ? "block" : "hidden"
                        }`}
                      >
                        <p className="flex items-start gap-1.5">
                          <UserCircle2 className="mt-0.5 h-3 w-3 text-indigo-500" />
                          <span className="min-w-0">
                            <span className="text-slate-400">Ortu:</span>{" "}
                            <span className="font-semibold text-slate-700">{r.parentName}</span> —{" "}
                            <a
                              href={phone}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-indigo-700 underline-offset-4 hover:underline"
                            >
                              {r.parentPhone}
                            </a>
                          </span>
                        </p>
                        <p className="flex items-start gap-1.5">
                          <Home className="mt-0.5 h-3 w-3 text-indigo-500" />
                          <span>{r.homeAddress}</span>
                        </p>
                        <div className="pt-1">
                          <StatusBadge status={r.pickupStatus} overdue={r.overdueMinutes} />
                        </div>
                        <div className="pt-1 flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <a
                            href={phone}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-500/20 sm:w-auto"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Orang Tua
                          </a>
                          <button
                            type="button"
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-400/50 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-800 transition hover:border-indigo-500/70 hover:bg-indigo-500/20 sm:w-auto"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Lihat Lokasi
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 align-top sm:table-cell">
                      <p className="text-sm font-semibold text-slate-800">{r.parentName}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                        <Phone className="h-3 w-3 text-amber-500" />
                        <a
                          href={phone}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-indigo-700 underline-offset-4 hover:underline"
                        >
                          {r.parentPhone}
                        </a>
                      </p>
                    </td>
                    <td className="hidden max-w-[280px] px-4 py-3 align-top text-sm text-slate-700 sm:table-cell">
                      <p className="flex items-start gap-1.5">
                        <Home className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span className="leading-6">{r.homeAddress}</span>
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 align-top sm:table-cell">
                      <StatusBadge status={r.pickupStatus} overdue={r.overdueMinutes} />
                    </td>
                    <td className="hidden px-4 py-3 text-right align-top sm:table-cell">
                      <div className="inline-flex flex-col items-end justify-end gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <a
                          href={phone}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:border-amber-500/70 hover:bg-amber-500/20"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Orang Tua
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-400/50 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-800 transition hover:border-indigo-500/70 hover:bg-indigo-500/20"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          Lihat Lokasi
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-right text-[11px] text-slate-400">
        Total: {filtered.length} dari {rows.length} siswa
      </p>
    </section>
  );
}
