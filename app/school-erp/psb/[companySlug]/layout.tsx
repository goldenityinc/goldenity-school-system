import type { ReactNode } from "react";
import { PsbShell } from "../../../../components/psb-demo/psb-shell";
import { getPsbDemoMeta } from "../../../../lib/psb-demo-data";

export default async function PsbDemoLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const meta = getPsbDemoMeta(companySlug);

  return (
    <PsbShell
      companySlug={companySlug}
      title={`${meta.schoolName} · Demo PSB`}
      description={meta.heroNote}
    >
      {children}
    </PsbShell>
  );
}
