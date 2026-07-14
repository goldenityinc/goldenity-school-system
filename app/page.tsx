import { redirect } from "next/navigation";
import { getDashboardMetrics } from "./actions/dashboard";
import { DashboardOverview } from "../components/dashboard-overview";
import { getCurrentSession } from "../lib/utils/jwt";

export default async function Home() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const tenantId = session.tenantId ?? "tenant-sd-01";
  const metrics = await getDashboardMetrics(tenantId);

  return <DashboardOverview userName={session.name ?? "User"} userRole={session.role ?? "TEACHER"} metrics={metrics} />;
}
