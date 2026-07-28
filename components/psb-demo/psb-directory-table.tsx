"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { PsbApplicantRecord } from "../../lib/psb-demo-data";
import { PsbStatusBadge } from "./psb-status-badge";
import { PsbSectionCard } from "./psb-section-card";

type DirectoryTableProps = {
  title: string;
  description: string;
  records: PsbApplicantRecord[];
  mode: "accepted" | "applicants";
  periodLabel?: string;
};

const pageSizeOptions = [5, 8, 10];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function PsbDirectoryTable({ title, description, records, mode, periodLabel }: DirectoryTableProps) {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [pathwayFilter, setPathwayFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesQuery =
        !normalizedQuery ||
        record.fullName.toLowerCase().includes(normalizedQuery) ||
        record.registrationNo.toLowerCase().includes(normalizedQuery) ||
        record.schoolOrigin.toLowerCase().includes(normalizedQuery);

      const matchesLevel = levelFilter === "ALL" || record.level === levelFilter;
      const matchesPathway = pathwayFilter === "ALL" || record.pathway === pathwayFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (mode === "accepted"
          ? (statusFilter === "Cadangan" ? record.status === "Cadangan" : record.status === "Diterima")
          : record.status === statusFilter || record.documentStatus === statusFilter);

      return matchesQuery && matchesLevel && matchesPathway && matchesStatus;
    });
  }, [levelFilter, mode, pathwayFilter, query, records, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  const statusOptions =
    mode === "accepted"
      ? ["ALL", "Diterima", "Cadangan"]
      : ["ALL", "Draft", "Terverifikasi", "Wawancara", "Diterima", "Cadangan", "Lengkap", "Perlu Revisi", "Menunggu"];

  return (
    <PsbSectionCard
      title={title}
      description={description}
      icon={SlidersHorizontal}
      aside={periodLabel ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{periodLabel}</span> : undefined}
    >
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={mode === "accepted" ? "Cari nama / nomor peserta" : "Cari nama / asal sekolah"}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
            />
          </label>

          <select
            value={levelFilter}
            onChange={(event) => {
              setLevelFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
          >
            <option value="ALL">Semua jenjang</option>
            <option value="TK">TK</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
          </select>

          <select
            value={pathwayFilter}
            onChange={(event) => {
              setPathwayFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
          >
            <option value="ALL">Semua jalur</option>
            <option value="Reguler">Reguler</option>
            <option value="Prestasi">Prestasi</option>
            <option value="Tahfidz">Tahfidz</option>
            <option value="Afirmasi">Afirmasi</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "Semua status" : option}
              </option>
            ))}
          </select>

          <select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} data / halaman
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pendaftar</th>
                  <th className="px-4 py-3 font-semibold">Jenjang</th>
                  <th className="px-4 py-3 font-semibold">Jalur</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Dokumen</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {pagedRecords.length ? (
                  pagedRecords.map((record) => (
                    <tr key={record.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{record.fullName}</p>
                        <p className="mt-1 text-xs text-slate-500">{record.registrationNo}</p>
                        <p className="mt-1 text-xs text-slate-500">{record.schoolOrigin}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{record.level}</td>
                      <td className="px-4 py-3.5"><PsbStatusBadge label={record.pathway} /></td>
                      <td className="px-4 py-3.5"><PsbStatusBadge label={record.status} /></td>
                      <td className="px-4 py-3.5"><PsbStatusBadge label={record.documentStatus} /></td>
                      <td className="px-4 py-3.5 text-slate-700">{formatDate(record.submittedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      Tidak ada data yang cocok dengan pencarian dan filter saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Menampilkan <span className="font-semibold text-slate-800">{pagedRecords.length}</span> dari{" "}
            <span className="font-semibold text-slate-800">{filteredRecords.length}</span> data.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
              Halaman {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage === totalPages}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </PsbSectionCard>
  );
}
