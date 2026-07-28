import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  ClipboardCheck,
  FileSpreadsheet,
  ScrollText,
  UserPlus
} from "lucide-react";
import { getPsbDemoMeta } from "../../../../lib/psb-demo-data";

type PsbRedirectCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

function createRedirectCards(companySlug: string): PsbRedirectCard[] {
  const basePath = `/school-erp/psb/${encodeURIComponent(companySlug)}`;
  return [
    {
      title: "Pendaftaran Siswa Baru",
      description: "Isi formulir pendaftaran dan pilih jadwal seleksi.",
      href: `${basePath}/register`,
      icon: UserPlus
    },
    {
      title: "Dashboard Pendaftar",
      description: "Lihat status berkas, timeline, dan jadwal wawancara.",
      href: `${basePath}/applicant-dashboard`,
      icon: ClipboardCheck
    },
    {
      title: "Dashboard Daftar Ulang",
      description: "Langkah daftar ulang, rincian biaya, dan lokasi layanan.",
      href: `${basePath}/accepted-dashboard`,
      icon: BellRing
    },
    {
      title: "Daftar Siswa Diterima",
      description: "Tabel siswa diterima lengkap dengan filter dan pencarian.",
      href: `${basePath}/accepted-students`,
      icon: FileSpreadsheet
    },
    {
      title: "Daftar Pendaftar",
      description: "Tabel seluruh pendaftar per status dan jalur seleksi.",
      href: `${basePath}/applicants`,
      icon: ScrollText
    }
  ];
}

export default async function PsbDemoHomePage({
  params
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const meta = getPsbDemoMeta(companySlug);
  const redirectCards = createRedirectCards(companySlug);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {meta.periodLabel}
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
            Penerimaan Siswa Baru {meta.brandShortName}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
            {meta.tagline}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {redirectCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-yellow-400 hover:shadow-md"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition group-hover:bg-yellow-400 group-hover:text-slate-900">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-slate-400">
          Tenant: {companySlug} · Mode demo
        </div>
      </div>
    </main>
  );
}
