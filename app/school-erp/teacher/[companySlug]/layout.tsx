import type { ReactNode } from "react";
import { TeacherShell } from "../../../../components/teacher-demo/teacher-shell";

export default async function TeacherDemoLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  return (
    <TeacherShell params={{ companySlug }}>
      {children}
    </TeacherShell>
  );
}
