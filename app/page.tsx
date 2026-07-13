import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getDashboardMetrics } from "./actions/dashboard";
import { DashboardOverview } from "../components/dashboard-overview";
import { authOptions } from "../lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId ?? "tenant-sd-01";
  const metrics = await getDashboardMetrics(tenantId);

  return <DashboardOverview userName={session.user.name ?? "User"} userRole={session.user.role ?? "TEACHER"} metrics={metrics} />;
}
