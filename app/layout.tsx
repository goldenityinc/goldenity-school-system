import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { DashboardShell } from "../components/dashboard-shell";
import { AuthSessionProvider } from "../components/session-provider";
import { TenantProvider } from "../components/tenant-context";
import { getCurrentSession } from "../lib/utils/jwt";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
});

export const metadata: Metadata = {
  title: "EduCore - Multi-Tenant School ERP",
  description: "Responsive ERP design system dashboard"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();

  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${jetbrainsMono.variable} bg-slate-50 text-slate-900`}>
        <AuthSessionProvider>
          <TenantProvider initialTenantId={session?.tenantId ?? null}>
            <DashboardShell>{children}</DashboardShell>
          </TenantProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
