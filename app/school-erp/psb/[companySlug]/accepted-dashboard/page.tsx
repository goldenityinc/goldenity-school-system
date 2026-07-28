import { CalendarClock, CheckCheck, MapPinHouse, WalletCards } from "lucide-react";
import { PsbSectionCard } from "../../../../../components/psb-demo/psb-section-card";
import { PsbStatusBadge } from "../../../../../components/psb-demo/psb-status-badge";
import { getAcceptedSteps, getAcceptedRecords, getPsbDemoMeta } from "../../../../../lib/psb-demo-data";

export default async function PsbAcceptedDashboardPage({
  params
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const meta = getPsbDemoMeta(companySlug);
  const acceptedStudent = getAcceptedRecords()[0];
  const steps = getAcceptedSteps();
  const totalFee = meta.feeBreakdown
    .map((item) => Number(item.amount.replace(/[^\d]/g, "")))
    .reduce((sum, value) => sum + value, 0)
    .toLocaleString("id-ID");

  return (
    <div className="space-y-5">
      <PsbSectionCard
        title="Dashboard Siswa Diterima / Daftar Ulang"
        description="Halaman ini menampilkan semua langkah yang perlu diselesaikan setelah siswa dinyatakan diterima."
        icon={CheckCheck}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">Status</p>
            <p className="mt-2 text-lg font-semibold text-emerald-950">{acceptedStudent.status}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Nama siswa</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{acceptedStudent.fullName}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Jenjang</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{acceptedStudent.level}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Nomor registrasi</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{acceptedStudent.registrationNo}</p>
          </div>
        </div>
      </PsbSectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PsbSectionCard
          title="Checklist Daftar Ulang"
          description="Setiap langkah dilengkapi deadline, lokasi, dan catatan operasional."
          icon={CalendarClock}
        >
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <PsbStatusBadge label={step.status} />
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{step.dueLabel}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.note}</p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                  <MapPinHouse className="h-3.5 w-3.5" />
                  {step.location}
                </p>
              </div>
            ))}
          </div>
        </PsbSectionCard>

        <div className="space-y-5">
          <PsbSectionCard
            title="Lokasi Layanan"
            description="Informasi tempat yang perlu didatangi selama daftar ulang."
            icon={MapPinHouse}
          >
            <div className="space-y-3 text-sm text-slate-700">
              {meta.serviceLocations.map((location) => (
                <div key={location.name} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">{location.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{location.description}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{location.serviceHours}</p>
                </div>
              ))}
            </div>
          </PsbSectionCard>

          <PsbSectionCard
            title="Simulasi Pembayaran"
            description="Contoh ringkasan biaya daftar ulang yang biasa dilihat setelah lolos seleksi."
            icon={WalletCards}
          >
            <div className="space-y-2 text-sm">
              {meta.feeBreakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.amount}</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-2xl border border-slate-950 bg-slate-950 px-4 py-3 text-white">
                <span>Total simulasi</span>
                <span className="font-semibold">Rp{totalFee}</span>
              </div>
            </div>
          </PsbSectionCard>
        </div>
      </div>
    </div>
  );
}
