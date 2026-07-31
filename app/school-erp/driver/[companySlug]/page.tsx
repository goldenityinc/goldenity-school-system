import { DriverStudentTable } from "../../../../components/driver-demo/driver-student-table";
import { getDriverStudentRecords } from "../../../../lib/driver-demo-data";

export default async function DriverLandingPage({
  params
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const sortedRecords = getDriverStudentRecords("nearest-first");

  return (
    <div className="space-y-5">
      <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-50/70 px-4 py-4 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Rute diurut berdasarkan jarak
        </p>
        <p className="mt-1 text-sm text-emerald-900">
          Baris teratas adalah siswa dengan <span className="font-semibold">jarak rumah terdekat</span>{" "}
          dari titik mobil saat ini. Cukup tekan <span className="font-semibold">Buka Maps</span>{" "}
          untuk navigasi, atau <span className="font-semibold">Telepon</span> jika perlu konfirmasi
          dengan orang tua.
        </p>
      </div>

      <DriverStudentTable companySlug={companySlug} records={sortedRecords} />
    </div>
  );
}
