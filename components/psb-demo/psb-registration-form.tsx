"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, FileBadge2, GraduationCap, UserRoundSearch } from "lucide-react";
import { getPsbDemoMeta } from "../../lib/psb-demo-data";
import { PsbSectionCard } from "./psb-section-card";

type RegistrationFormProps = {
  companySlug: string;
};

type FormState = {
  studentName: string;
  parentName: string;
  level: string;
  pathway: string;
  schoolOrigin: string;
  phone: string;
  notes: string;
};

const initialState: FormState = {
  studentName: "",
  parentName: "",
  level: "SD",
  pathway: "Reguler",
  schoolOrigin: "",
  phone: "",
  notes: ""
};

export function PsbRegistrationForm({ companySlug }: RegistrationFormProps) {
  const meta = getPsbDemoMeta(companySlug);
  const [form, setForm] = useState<FormState>(initialState);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const registrationNo = useMemo(() => {
    if (!submittedAt) return null;
    return `PSB-${new Date(submittedAt).getFullYear()}-${Math.floor(2000 + submittedAt.length)}`;
  }, [submittedAt]);

  function updateField<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedAt(new Date().toISOString());
  }

  return (
    <div className="space-y-5">
      <PsbSectionCard
        title="Pilihan Jadwal Seleksi"
        description="Pilih salah satu slot wawancara sebelum mengisi formulir pendaftaran."
        icon={CalendarDays}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {meta.interviewSlots.map((slot) => (
            <div
              key={slot.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 transition hover:border-yellow-400 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{slot.title}</p>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Slot demo</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{slot.time}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{slot.location}</p>
            </div>
          ))}
        </div>
      </PsbSectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
        <PsbSectionCard
          title="Formulir Pendaftaran"
          description="Simulasi pendaftaran calon siswa baru dengan tampilan yang siap didemokan ke client."
          icon={UserRoundSearch}
        >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nama calon siswa</span>
              <input
                value={form.studentName}
                onChange={(event) => updateField("studentName", event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Contoh: Alya Khairunnisa"
                required
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nama orang tua / wali</span>
              <input
                value={form.parentName}
                onChange={(event) => updateField("parentName", event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Contoh: Siti Nur Aini"
                required
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Jenjang</span>
              <select
                value={form.level}
                onChange={(event) => updateField("level", event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
              >
                <option value="TK">TK</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Jalur masuk</span>
              <select
                value={form.pathway}
                onChange={(event) => updateField("pathway", event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
              >
                <option value="Reguler">Reguler</option>
                <option value="Prestasi">Prestasi</option>
                <option value="Tahfidz">Tahfidz</option>
                <option value="Afirmasi">Afirmasi</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Asal sekolah</span>
              <input
                value={form.schoolOrigin}
                onChange={(event) => updateField("schoolOrigin", event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Contoh: SDIT Cendekia"
                required
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nomor WhatsApp</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="08xxxxxxxxxx"
                required
              />
            </label>
          </div>

          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Catatan tambahan</span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
              placeholder="Contoh: tertarik pada kelas tahfidz atau program bilingual"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <span>Form ini hanya demo frontend. Data tidak tersimpan ke database dan aman untuk presentasi.</span>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
            >
              <CheckCircle2 className="h-4 w-4" />
              Submit Form Demo
            </button>
          </div>
        </form>
      </PsbSectionCard>

      <div className="space-y-5">
        <PsbSectionCard
          title="Informasi Berkas"
          description="Dokumen yang disiapkan calon siswa sebelum proses verifikasi."
          icon={FileBadge2}
        >
          <ul className="space-y-2.5">
            {meta.documents.map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </PsbSectionCard>

        <PsbSectionCard
          title="Hasil Submit Demo"
          description="Setelah form dikirim, calon pendaftar menerima nomor registrasi simulasi."
          icon={GraduationCap}
        >
          {submittedAt ? (
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Formulir demo berhasil dikirim
              </div>
              <p>Nomor registrasi: <span className="font-bold">{registrationNo}</span></p>
              <p className="text-xs leading-5 text-emerald-800">
                Langkah berikutnya: tim panitia akan meninjau dokumen dan menjadwalkan verifikasi di dashboard pendaftar.
              </p>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              Belum ada simulasi submit. Isi formulir lalu klik tombol submit untuk menampilkan feedback sukses.
            </p>
          )}
        </PsbSectionCard>
      </div>
      </div>
    </div>
  );
}
