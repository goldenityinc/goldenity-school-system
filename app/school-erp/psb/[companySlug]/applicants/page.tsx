import { UsersRound } from "lucide-react";
import { PsbDirectoryTable } from "../../../../../components/psb-demo/psb-directory-table";
import { PsbSectionCard } from "../../../../../components/psb-demo/psb-section-card";
import { getApplicantRecords, getPsbDemoMeta } from "../../../../../lib/psb-demo-data";

export default async function PsbApplicantsPage({
  params
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const meta = getPsbDemoMeta(companySlug);
  const applicantRecords = getApplicantRecords();

  return (
    <div className="space-y-5">
      <PsbSectionCard
        title="Daftar Pendaftar Siswa"
        description="Tabel demo seluruh pendaftar per periode PSB lengkap dengan status, dokumen, dan pencarian."
        icon={UsersRound}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total pendaftar</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{applicantRecords.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Menunggu verifikasi</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {applicantRecords.filter((item) => item.documentStatus === "Menunggu").length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Tahap wawancara</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {applicantRecords.filter((item) => item.status === "Wawancara").length}
            </p>
          </div>
        </div>
      </PsbSectionCard>

      <PsbDirectoryTable
        title="Tabel Pendaftar PSB"
        description="Filter client-side dibuat untuk memudahkan eksplorasi data demo saat presentasi."
        records={applicantRecords}
        mode="applicants"
        periodLabel={meta.periodLabel}
      />
    </div>
  );
}
