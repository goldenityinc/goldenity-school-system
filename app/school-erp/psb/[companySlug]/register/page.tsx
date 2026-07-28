import { BadgeInfo } from "lucide-react";
import { PsbRegistrationForm } from "../../../../../components/psb-demo/psb-registration-form";
import { PsbSectionCard } from "../../../../../components/psb-demo/psb-section-card";

export default async function PsbRegisterPage({
  params
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  return (
    <div className="space-y-5">
      <PsbSectionCard
        title="Pendaftaran Siswa Baru"
        description="Form demo ini menampilkan pengalaman calon siswa saat melakukan registrasi awal."
        icon={BadgeInfo}
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Formulir di bawah mensimulasikan submit sukses beserta nomor registrasi demo. Tidak ada data yang disimpan ke
          backend pada fase ini.
        </div>
      </PsbSectionCard>

      <PsbRegistrationForm companySlug={companySlug} />
    </div>
  );
}
