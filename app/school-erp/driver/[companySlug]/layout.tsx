import type { ReactNode } from "react";
import { DriverShell } from "../../../../components/driver-demo/driver-shell";
import type { DriverShellNextStudent } from "../../../../components/driver-demo/driver-shell";
import { getDriverCompanyMeta, getDriverStudentRecords } from "../../../../lib/driver-demo-data";

function pickNextStudent(companySlug: string): DriverShellNextStudent {
  const sorted = getDriverStudentRecords("nearest-first");
  const next = sorted.find((record) => record.pickupStatus !== "Delivered") ?? sorted[0] ?? null;
  if (!next) return null;
  return {
    studentName: next.studentName,
    gradeLevel: next.gradeLevel,
    className: next.className,
    distanceKm: next.distanceKm,
    homeAddress: next.homeAddress,
    parentName: next.parentName,
    parentPhone: next.parentPhone,
    homeLatitude: next.homeLatitude,
    homeLongitude: next.homeLongitude
  };
}

export default async function DriverDemoLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const meta = getDriverCompanyMeta(companySlug);
  const nextStudent = pickNextStudent(companySlug);

  return (
    <DriverShell
      companySlug={companySlug}
      title={`${meta.schoolName} · Dashboard Antar Jemput`}
      description="Pantau daftar siswa di dalam mobil, urutkan berdasarkan jarak terdekat, lalu navigasi ke rumah masing-masing dengan sekali klik."
      nextStudent={nextStudent}
    >
      {children}
    </DriverShell>
  );
}
