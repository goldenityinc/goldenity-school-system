"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTenant } from "./tenant-context";

type NavItem = {
  label: string;
  href: string;
  requiredModule?: string;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/" },
  { label: "Students", href: "/students" },
  { label: "Academics", href: "/academics", requiredModule: "ACADEMICS" },
  { label: "Billing", href: "/billing", requiredModule: "FINANCE" }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { selectedTenant, setSelectedTenant, tenantOptions, activeTenantLabel } = useTenant();
  const { data: session } = useSession();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const userRole = session?.user?.role ?? "TEACHER";
  const userName = session?.user?.name ?? "User";
  const activeModules = session?.user?.activeModules ?? [];
  const userInitials = userName
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiredModule) {
      return true;
    }

    return activeModules.includes(item.requiredModule);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="flex w-full flex-col border-b border-slate-800 bg-slate-900 text-slate-100 md:w-64 md:border-b-0 md:border-r">
          <div className="flex items-center gap-3 border-b border-slate-800 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500 font-black text-slate-900">e</div>
            <div>
              <p className="text-sm font-semibold">EduCore</p>
              <p className="text-xs text-slate-400">{userRole}</p>
            </div>
          </div>
          <nav aria-label="Primary" className="flex-1 space-y-1 p-3 text-sm">
            {filteredNavItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 font-medium ${
                    isActive ? "bg-yellow-500 text-slate-900" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="m-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Current Tenant</p>
            <p className="mt-1 text-sm font-semibold">{activeTenantLabel}</p>
            <p className="text-xs text-slate-500">{selectedTenant}</p>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold">{activeTenantLabel}</p>
                <p className="text-xs text-slate-500">Tenant aktif</p>
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-center gap-3">
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                  <span className="text-slate-400">Tenant Switcher</span>
                  <select
                    aria-label="Tenant switcher"
                    className="bg-transparent text-sm font-medium text-slate-900 outline-none"
                    value={selectedTenant}
                    onChange={(event) => setSelectedTenant(event.target.value)}
                  >
                    {tenantOptions.map((tenant) => (
                      <option key={tenant.value} value={tenant.value}>
                        {tenant.label} ({tenant.value})
                      </option>
                    ))}
                  </select>
                </label>

                <form className="w-full max-w-xs sm:w-auto" role="search">
                  <label htmlFor="global-search" className="sr-only">
                    Search students or schools
                  </label>
                  <input
                    id="global-search"
                    type="search"
                    placeholder="Search students, schools..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-yellow-500 placeholder:text-slate-400 focus:ring-2"
                  />
                </form>
              </div>

              <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50" type="button">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-yellow-500">{userInitials || "U"}</span>
                <span>
                  <span className="block text-sm font-semibold">{userName}</span>
                  <span className="block text-xs text-slate-500">{userRole}</span>
                </span>
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Logout
              </button>
            </div>
          </header>

          <main className="p-4 sm:p-6" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
