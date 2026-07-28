import { ListChecks } from "lucide-react";
import { PsbDirectoryTable } from "../../../../../components/psb-demo/psb-directory-table";
import { PsbSectionCard } from "../../../../../components/psb-demo/psb-section-card";
import { getAcceptedRecords, getPsbDemoMeta } from "../../../../../lib/psb-demo-data";

export default async function PsbAcceptedStudentsPage({
  params
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const meta = getPsbDemoMeta(companySlug);
  const acceptedRecords = getAcceptedRecords();

  return (
    <div className="space-y-5">
      <PsbSectionCard
        title="Daftar Siswa Diterima"
        description="Tabel demo siswa yang lolos pada periode PSB berjalan lengkap dengan search, filter, dan pagination."
        icon={ListChecks}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total siswa diterima</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{acceptedRecords.filter((item) => item.status === "Diterima").length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Cadangan</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{acceptedRecords.filter((item) => item.status === "Cadangan").length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Kelengkapan dokumen</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">100%</p>
          </div>
        </div>
      </PsbSectionCard>

      <PsbDirectoryTable
        title="Tabel Siswa Diterima"
        description="Gunakan filter untuk mempresentasikan berbagai skenario penerimaan."
        records={acceptedRecords}
        mode="accepted"
        periodLabel={meta.periodLabel}
      />
    </div>
  );
}
