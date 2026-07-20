"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  requiredModule?: string;
};

type AcademicsSubItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Murid", href: "/students" },
  { label: "Karyawan", href: "/hr/employees", requiredModule: "SCHOOL_ERP" },
  { label: "Tagihan", href: "/billing", requiredModule: "FINANCE" },
  { label: "Pengaturan", href: "/settings" }
];

const academicsSubItems: AcademicsSubItem[] = [
  { label: "Manajemen Kelas", href: "/academics/classrooms" },
  { label: "Kurikulum & Mapel", href: "/academics/curriculum" },
  { label: "Jadwal Pelajaran", href: "/academics/schedules" },
  { label: "Penilaian (Nilai)", href: "/academics/grades" }
];

function roleLabel(role?: string) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "TENANT_ADMIN") return "Admin Tenant";
  if (role === "TEACHER") return "Guru";
  if (role === "STAFF") return "Staf";
  return "Pengguna";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAcademicsExpanded, setIsAcademicsExpanded] = useState(false);
  const [session, setSession] = useState<{
    user?: {
      role?: string;
      name?: string;
      allowedSolutions?: string[];
      profilePhotoUrl?: string | null;
      tenantLogoUrl?: string | null;
      tenantName?: string;
    };
  } | null>(null);

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    let isActive = true;

    async function loadSession() {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store"
      });

      if (!isActive) {
        return;
      }

      if (!response.ok) {
        router.replace("/login");
        return;
      }

      const payload = (await response.json()) as {
        session?: {
          role?: string;
          name?: string;
          allowedSolutions?: string[];
          profilePhotoUrl?: string | null;
          tenantLogoUrl?: string | null;
          tenantName?: string;
        };
      };

      setSession({
        user: {
          role: payload.session?.role,
          name: payload.session?.name,
          allowedSolutions: payload.session?.allowedSolutions,
          profilePhotoUrl: payload.session?.profilePhotoUrl ?? null,
          tenantLogoUrl: payload.session?.tenantLogoUrl ?? null,
          tenantName: payload.session?.tenantName
        }
      });
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const userRole = session?.user?.role ?? "TEACHER";
  const userName = session?.user?.name ?? "Pengguna";
  const tenantName = session?.user?.tenantName ?? "Tenant";
  const userPhotoUrl = session?.user?.profilePhotoUrl ?? null;
  const tenantLogoUrl = session?.user?.tenantLogoUrl ?? null;
  const activeModules = session?.user?.allowedSolutions ?? [];
  const userInitials = userName
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredNavItems = navItems.filter((item) => {
    if (activeModules.includes("SCHOOL_ERP")) {
      return true;
    }

    if (!item.requiredModule) {
      return true;
    }

    return activeModules.includes(item.requiredModule);
  });

  const hasAcademicsAccess = activeModules.includes("SCHOOL_ERP") || activeModules.includes("ACADEMICS");
  const isAcademicsActive = academicsSubItems.some((item) => pathname.startsWith(item.href));
  const academicsIsOpen = isAcademicsExpanded || isAcademicsActive;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="flex w-full flex-col border-b border-slate-800 bg-slate-900 text-slate-100 md:w-64 md:border-b-0 md:border-r">
          <div className="flex items-center gap-3 border-b border-slate-800 p-4">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-yellow-500 font-black text-slate-900">
              {tenantLogoUrl ? <Image src={tenantLogoUrl} alt="Logo tenant" width={32} height={32} className="h-full w-full object-cover" unoptimized /> : <span>e</span>}
            </div>
            <div>
              <p className="text-sm font-semibold">EduCore</p>
              <p className="text-xs text-slate-400">{tenantName}</p>
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

            {hasAcademicsAccess ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setIsAcademicsExpanded((previous) => !previous)}
                  aria-expanded={academicsIsOpen}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 font-medium transition ${
                    isAcademicsActive ? "bg-yellow-500 text-slate-900" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>Akademik</span>
                  <span className={`text-xs transition ${academicsIsOpen ? "rotate-180" : ""}`}>⌄</span>
                </button>

                {academicsIsOpen ? (
                  <div className="ml-3 space-y-1 border-l border-slate-700 pl-3">
                    {academicsSubItems.map((subItem) => {
                      const isSubActive = pathname.startsWith(subItem.href);

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block rounded-md px-3 py-2 text-sm transition ${
                            isSubActive ? "bg-yellow-500 text-slate-900" : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1" />

              <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50" type="button">
                <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-semibold text-yellow-500">
                  {userPhotoUrl ? <Image src={userPhotoUrl} alt="Foto profil" width={28} height={28} className="h-full w-full object-cover" unoptimized /> : userInitials || "U"}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{userName}</span>
                  <span className="block text-xs text-slate-500">{roleLabel(userRole)}</span>
                </span>
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.replace("/login");
                }}
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
