import { CalendarClock, ClipboardList, FileCheck2, MessagesSquare, TimerReset } from "lucide-react";
import { PsbSectionCard } from "../../../../../components/psb-demo/psb-section-card";
import { PsbStatusBadge } from "../../../../../components/psb-demo/psb-status-badge";
import { getApplicantRecords, getApplicantTimeline, getPsbDemoMeta } from "../../../../../lib/psb-demo-data";

export default async function PsbApplicantDashboardPage({
  params
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const meta = getPsbDemoMeta(companySlug);
  const applicant = getApplicantRecords()[1];
  const timeline = getApplicantTimeline();

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <PsbSectionCard title="Dashboard Pendaftar" description="Ringkasan status pendaftaran calon siswa." icon={ClipboardList}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Nama calon siswa</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{applicant.fullName}</p>
              <p className="mt-1 text-sm text-slate-500">{applicant.registrationNo}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Jalur & jenjang</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <PsbStatusBadge label={applicant.pathway} />
                <PsbStatusBadge label={applicant.level} />
                <PsbStatusBadge label={applicant.status} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Wave & target</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{meta.waveLabel}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Prioritas penempatan kelas dibuka selama kuota masih tersedia.</p>
            </div>
          </div>
        </PsbSectionCard>

        <PsbSectionCard
          title="Timeline Proses"
          description="Tahapan proses sejak formulir dikirim sampai pengumuman hasil."
          icon={TimerReset}
        >
          <div className="space-y-3">
            {timeline.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <PsbStatusBadge label={item.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <p className="mt-2 text-xs text-slate-500">{item.dateLabel}</p>
              </div>
            ))}
          </div>
        </PsbSectionCard>
      </div>

      <div className="space-y-5">
        <PsbSectionCard
          title="Status Dokumen"
          description="Ringkasan berkas yang sudah diverifikasi dan yang masih perlu ditinjau."
          icon={FileCheck2}
        >
          <div className="space-y-2.5 text-sm">
            {meta.documents.map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <span className="pr-3 text-slate-700">{item}</span>
                <PsbStatusBadge label={index === 2 ? "Menunggu" : "Lengkap"} />
              </div>
            ))}
          </div>
        </PsbSectionCard>

        <PsbSectionCard
          title="Catatan Panitia"
          description="Informasi yang biasanya dikomunikasikan ke orang tua selama proses berlangsung."
          icon={MessagesSquare}
        >
          <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            <p>Wawancara orang tua dijadwalkan pada 9 Juli 2026 di Ruang Konsultasi Gedung A.</p>
            <p>Silakan siapkan berkas asli kartu keluarga dan rapor terakhir untuk proses pengecekan fisik.</p>
            <p>Jika ada revisi dokumen, pembaruan status akan tampil otomatis di dashboard ini.</p>
          </div>
        </PsbSectionCard>

        <PsbSectionCard
          title="Agenda Berikutnya"
          description="Rangkuman aktivitas terdekat setelah tahap verifikasi selesai."
          icon={CalendarClock}
        >
          <div className="space-y-2.5">
            {meta.interviewSlots.map((slot) => (
              <div key={slot.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{slot.title}</p>
                  <PsbStatusBadge label="current" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{slot.time}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{slot.location}</p>
              </div>
            ))}
          </div>
        </PsbSectionCard>
      </div>
    </div>
  );
}
