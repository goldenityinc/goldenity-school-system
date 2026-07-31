"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Navigation,
  Phone,
  UserCircle2
} from "lucide-react";
import {
  type DriverStudentRecord,
  buildGoogleMapsUrl,
  buildPhoneCallUrl
} from "../../lib/driver-demo-data";

type DriverStudentTableProps = {
  companySlug: string;
  records: DriverStudentRecord[];
};

type StatusVariant = "next" | "onCar" | "delivered" | "pending";

function statusVariant(record: DriverStudentRecord, isNextStop: boolean): StatusVariant {
  if (isNextStop && record.pickupStatus !== "Delivered") return "next";
  if (record.pickupStatus === "Delivered") return "delivered";
  if (record.pickupStatus === "On Car") return "onCar";
  return "pending";
}

function statusLabel(variant: StatusVariant): string {
  switch (variant) {
    case "next":
      return "Menuju Tujuan";
    case "onCar":
      return "Di Dalam Mobil";
    case "delivered":
      return "Sudah Sampai";
    case "pending":
      return "Menunggu";
  }
}

function StatusBadge({ variant }: { variant: StatusVariant }) {
  const baseClass =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap";
  switch (variant) {
    case "next":
      return (
        <span
          className={`${baseClass} bg-blue-50 text-blue-700 ring-1 ring-blue-600/20`}
        >
          <Navigation className="h-3 w-3" />
          {statusLabel(variant)}
        </span>
      );
    case "onCar":
      return (
        <span className={`${baseClass} bg-blue-50 text-blue-700 ring-1 ring-blue-600/20`}>
          <BadgeCheck className="h-3 w-3" />
          {statusLabel(variant)}
        </span>
      );
    case "delivered":
      return (
        <span className={`${baseClass} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20`}>
          <BadgeCheck className="h-3 w-3" />
          {statusLabel(variant)}
        </span>
      );
    case "pending":
      return (
        <span className={`${baseClass} bg-amber-50 text-amber-700 ring-1 ring-amber-600/20`}>
          {statusLabel(variant)}
        </span>
      );
  }
}

function distanceTag(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1).replace(".", ",")} km`;
}

export function DriverStudentTable({ companySlug, records }: DriverStudentTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(records[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "On Car" | "Delivered">("all");

  const visibleRecords = useMemo(() => {
    if (filter === "all") return records;
    return records.filter((record) => record.pickupStatus === filter);
  }, [records, filter]);

  const firstActiveIndex = useMemo(() => {
    return visibleRecords.findIndex((record) => record.pickupStatus !== "Delivered");
  }, [visibleRecords]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Tampilkan
          </span>
          {([
            ["all", "Semua"],
            ["On Car", "Di Mobil"],
            ["Delivered", "Sudah Diantar"]
          ] as const).map(([value, label]) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            {visibleRecords.length} siswa · Terurut jarak terdekat
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
            <code className="font-semibold">tenant: {companySlug}</code>
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
        <div className="hidden border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 md:grid md:grid-cols-12 md:gap-2 lg:gap-4">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-2">Siswa / Kelas</div>
          <div className="col-span-2">Orang Tua</div>
          <div className="col-span-3">Alamat</div>
          <div className="col-span-1 text-right">Jarak</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Aksi</div>
        </div>

        <ul className="divide-y divide-slate-100">
          {visibleRecords.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-slate-500">
              Tidak ada siswa yang sesuai filter.
            </li>
          ) : (
            visibleRecords.map((record, index) => {
              const isNextStop = firstActiveIndex === index;
              const variant = statusVariant(record, isNextStop);
              const isExpanded = expandedId === record.id;
              const mapsUrl = buildGoogleMapsUrl(
                record.homeLatitude,
                record.homeLongitude,
                `${record.studentName} - ${record.homeAddress}`
              );
              const phoneUrl = buildPhoneCallUrl(record.parentPhone);
              const rowClass = isNextStop
                ? "border-l-4 border-l-blue-500 bg-blue-50/40"
                : variant === "delivered"
                  ? "bg-emerald-50/40"
                  : "bg-white";

              return (
                <li key={record.id} className={rowClass}>
                  <div
                    className="grid grid-cols-1 items-start gap-3 px-4 py-4 md:grid-cols-12 md:gap-2 md:px-5 md:items-center md:min-h-[84px] lg:gap-4"
                  >
                    <div className="flex items-center gap-3 md:col-span-1 md:justify-center md:self-center">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                        aria-expanded={isExpanded}
                        aria-label={`Toggle detail ${record.studentName}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 md:hidden"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-1 ${
                          isNextStop
                            ? "bg-blue-500 text-white ring-blue-600/30"
                            : variant === "delivered"
                              ? "bg-emerald-500 text-white ring-emerald-500/30"
                              : "bg-white text-slate-700 ring-slate-200"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>

                    <div className="md:col-span-2 md:self-center">
                      <div className="flex items-start gap-2 md:hidden">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Siswa
                        </span>
                        <StatusBadge variant={variant} />
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          variant === "delivered" ? "text-slate-500" : "text-slate-900"
                        }`}
                      >
                        {record.studentName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 whitespace-nowrap">
                        {record.gradeLevel} · {record.className}
                      </p>
                    </div>

                    <div className="md:col-span-2 md:self-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                        Orang Tua
                      </p>
                      <p className="flex items-center gap-1.5 text-sm text-slate-800">
                        <UserCircle2 className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{record.parentName}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{record.parentPhone}</p>
                    </div>

                    <div className="md:col-span-3 md:self-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                        Alamat Rumah
                      </p>
                      <p className="text-sm text-slate-800 break-words leading-snug">
                        {record.homeAddress}
                      </p>
                    </div>

                    <div className="md:col-span-1 md:self-center md:text-right md:whitespace-nowrap">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                        Jarak
                      </p>
                      <p
                        className={`text-sm font-bold whitespace-nowrap ${
                          isNextStop
                            ? "text-blue-700"
                            : variant === "delivered"
                              ? "text-emerald-700 line-through"
                              : "text-slate-800"
                        }`}
                      >
                        {distanceTag(record.distanceKm)}
                      </p>
                    </div>

                    <div className="hidden md:col-span-2 md:flex md:justify-center md:self-center md:whitespace-nowrap">
                      <StatusBadge variant={variant} />
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-2 md:col-span-1 md:self-center md:justify-end md:gap-1.5 flex-wrap md:flex-nowrap">
                      <a
                        href={phoneUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Telepon ${record.parentName}`}
                        title={`Telepon ${record.parentName}`}
                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700 hover:shadow"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Buka Maps untuk ${record.studentName}`}
                        title={`Buka Maps untuk ${record.studentName}`}
                        className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg shadow-sm transition ${
                          isNextStop
                            ? "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500"
                            : "border border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        <Navigation className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div
                    className={`grid gap-3 border-t border-dashed border-slate-200 px-4 pb-4 pt-3 text-xs text-slate-600 md:hidden ${
                      isExpanded ? "block" : "hidden"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-500">Kontak Orang Tua</span>
                      <a
                        href={phoneUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Telepon {record.parentPhone}
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
                      <span>Arah ke Rumah Siswa</span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Buka Google Maps
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status Rute</span>
                      <StatusBadge variant={variant} />
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
