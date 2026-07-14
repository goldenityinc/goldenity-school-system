import { redirect } from "next/navigation";
import { getDashboardMetrics } from "./actions/dashboard";
import type { DashboardMetrics } from "./actions/dashboard";
import { DashboardOverview } from "../components/dashboard-overview";
import { getCurrentSession } from "../lib/utils/jwt";

const FALLBACK_METRICS: DashboardMetrics = {
  totalActiveStudents: 0,
  totalTeachers: 0,
  totalClassrooms: 0,
  totalRevenueThisMonth: 0,
  todaySchedule: []
};

export default async function Home() {
  const session = await getCurrentSession();

  if (!session?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.tenantId;
  let metrics = FALLBACK_METRICS;

  try {
    metrics = await getDashboardMetrics(tenantId);
  } catch (error) {
    console.error("DASHBOARD_METRICS_FAILED", {
      tenantId,
      error: error instanceof Error ? error.message : error
    });
  }

  return <DashboardOverview userName={session.name ?? "Pengguna"} userRole={session.role ?? "TEACHER"} metrics={metrics} />;
}
