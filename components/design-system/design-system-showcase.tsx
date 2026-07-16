"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Users,
  Zap
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Modal } from "../ui/modal";

type SectionId = "overview" | "typography" | "colors" | "buttons" | "inputs" | "badges" | "table" | "flags" | "modals";
type StudentStatus = "active" | "pending" | "inactive" | "suspended" | "trial";

type Student = {
  id: number;
  name: string;
  grade: string;
  school: string;
  status: StudentStatus;
  enrolled: string;
  fee: string;
};

const sections: Array<{ id: SectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "typography", label: "Typography" },
  { id: "colors", label: "Colors" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "badges", label: "Badges" },
  { id: "table", label: "Data Table" },
  { id: "flags", label: "Feature Flags" },
  { id: "modals", label: "Modals" }
];

const studentsSeed: Student[] = [
  { id: 1, name: "Amara Okafor", grade: "Grade 10", school: "Greenfield Academy", status: "active", enrolled: "12 Aug 2024", fee: "$1,200" },
  { id: 2, name: "Liam Nakamura", grade: "Grade 8", school: "Riverside International", status: "pending", enrolled: "03 Sep 2024", fee: "$950" },
  { id: 3, name: "Priya Sharma", grade: "Grade 11", school: "Pinnacle High School", status: "active", enrolled: "28 Jul 2024", fee: "$1,450" },
  { id: 4, name: "Ethan Muller", grade: "Grade 7", school: "Greenfield Academy", status: "inactive", enrolled: "15 Jan 2024", fee: "$800" },
  { id: 5, name: "Sofia Mendoza", grade: "Grade 12", school: "Riverside International", status: "suspended", enrolled: "01 Jun 2023", fee: "$1,600" },
  { id: 6, name: "Kwame Asante", grade: "Grade 9", school: "Pinnacle High School", status: "trial", enrolled: "09 Oct 2024", fee: "$0" }
];

const tokenCards = [
  { label: "Primary", className: "bg-primary text-white" },
  { label: "Accent", className: "bg-accent text-primary" },
  { label: "Surface", className: "bg-surface border border-slate-200 text-primary" },
  { label: "Background", className: "bg-background border border-slate-200 text-slate-700" }
];

const flagsSeed = [
  { id: "biometric", label: "Biometric Attendance", desc: "Enable biometric check-in", tier: "pro", enabled: true },
  { id: "analytics", label: "Advanced Analytics", desc: "Enable cohort and risk analytics", tier: "enterprise", enabled: false },
  { id: "sms", label: "SMS Notification", desc: "Enable guardian SMS alerts", tier: "starter", enabled: true }
];

function statusVariant(status: StudentStatus): "active" | "pending" | "inactive" | "suspended" | "trial" {
  return status;
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-3 h-px bg-slate-200" />
    </div>
  );
}

export function DesignSystemShowcase() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StudentStatus>("all");
  const [page, setPage] = useState(1);
  const [rowMenuOpen, setRowMenuOpen] = useState<number | null>(null);
  const [flags, setFlags] = useState(flagsSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const perPage = 5;
  const filteredStudents = useMemo(() => {
    return studentsSeed.filter((s) => {
      const matchQuery = s.name.toLowerCase().includes(query.toLowerCase()) || s.school.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / perPage));
  const pagedStudents = filteredStudents.slice((page - 1) * perPage, page * perPage);

  const startIndex = filteredStudents.length === 0 ? 0 : (page - 1) * perPage + 1;
  const endIndex = Math.min(filteredStudents.length, page * perPage);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Zap className="h-3 w-3" />
              EduCore Design System
            </p>
            <h1 className="mt-3 text-3xl font-bold text-primary">Multi-Tenant School ERP Design System</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Dokumentasi komponen UI untuk dashboard internal: konsisten, aksesibel, dan siap dipakai lintas modul.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Open notifications" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-primary">
              <Bell className="h-4 w-4" />
            </button>
            <Button variant="primary" size="md" className="bg-primary text-white hover:bg-slate-800">
              Publish Tokens
            </Button>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-10 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft">
        <div className="flex flex-wrap gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeSection === section.id ? "bg-primary text-accent" : "text-slate-500 hover:bg-slate-100 hover:text-primary"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        {activeSection === "overview" && (
          <div>
            <SectionHeader title="Overview" description="Ringkasan token visual dan status semantic yang dipakai lintas modul." />
            <div className="grid gap-4 lg:grid-cols-4">
              {[
                { label: "Total Tenants", value: "24", delta: "+3 bulan ini" },
                { label: "Active Students", value: "14,820", delta: "+8.4% YoY" },
                { label: "MRR", value: "$48,600", delta: "+12.1%" },
                { label: "Pending Reviews", value: "7", delta: "2 urgent" }
              ].map((item) => (
                <article key={item.label} className="rounded-xl border border-slate-200 bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.delta}</p>
                </article>
              ))}
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Core Tokens</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {tokenCards.map((item) => (
                    <div key={item.label} className={`min-h-16 rounded-lg p-2 text-xs font-semibold ${item.className}`}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </article>
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status Palette</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="active">Active</Badge>
                  <Badge variant="pending">Pending</Badge>
                  <Badge variant="suspended">Suspended</Badge>
                  <Badge variant="inactive">Inactive</Badge>
                  <Badge variant="trial">Trial</Badge>
                </div>
              </article>
            </div>
          </div>
        )}

        {activeSection === "typography" && (
          <div>
            <SectionHeader title="Typography" description="Plus Jakarta Sans untuk UI copy, JetBrains Mono untuk data label dan kode." />
            <div className="space-y-2">
              {[
                { name: "Display / H1", cls: "text-4xl font-bold", sample: "School Management System", meta: "36px / 1.2" },
                { name: "Heading / H2", cls: "text-2xl font-semibold", sample: "Student Enrollment Overview", meta: "24px / 1.3" },
                { name: "Heading / H3", cls: "text-xl font-semibold", sample: "Academic Performance Report", meta: "20px / 1.4" },
                { name: "Body", cls: "text-sm font-normal", sample: "Students are enrolled across all active tenant schools.", meta: "14px / 1.6" },
                { name: "Caption", cls: "text-xs font-medium uppercase tracking-wider", sample: "Last updated 16 Jul 2026", meta: "12px / 1.6" }
              ].map((item) => (
                <article key={item.name} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                  <div className="w-44 flex-none text-xs text-slate-400">{item.name} - {item.meta}</div>
                  <p className={`${item.cls} text-primary`}>{item.sample}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeSection === "colors" && (
          <div>
            <SectionHeader title="Color Tokens" description="Semua warna utama direferensikan dari token dan utility, bukan nilai hardcoded." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {[
                { label: "Primary", hex: "#0F172A", cls: "bg-primary text-white" },
                { label: "Accent", hex: "#EAB308", cls: "bg-accent text-primary" },
                { label: "Background", hex: "#F8FAFC", cls: "bg-background border border-slate-200 text-slate-700" },
                { label: "Surface", hex: "#FFFFFF", cls: "bg-surface border border-slate-200 text-slate-700" },
                { label: "Success", hex: "emerald", cls: "bg-emerald-500 text-white" },
                { label: "Warning", hex: "amber", cls: "bg-amber-500 text-white" },
                { label: "Danger", hex: "red", cls: "bg-red-500 text-white" },
                { label: "Info", hex: "blue", cls: "bg-blue-500 text-white" }
              ].map((item) => (
                <article key={item.label} className="space-y-1">
                  <div className={`flex h-16 items-end rounded-lg p-2 text-xs font-semibold ${item.cls}`}>{item.hex}</div>
                  <p className="text-xs font-semibold text-primary">{item.label}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeSection === "buttons" && (
          <div>
            <SectionHeader title="Buttons" description="Menggunakan komponen Button shared dengan varian ukuran dan state dasar." />
            <div className="space-y-4">
              {(["sm", "md", "lg"] as const).map((size) => (
                <article key={size} className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Size: {size.toUpperCase()}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size={size} variant="primary" className="bg-primary text-white hover:bg-slate-800">Primary</Button>
                    <Button size={size} variant="secondary">Secondary</Button>
                    <Button size={size} variant="outline">Outline</Button>
                    <Button size={size} variant="danger">Danger</Button>
                    <Button size={size} variant="ghost">Ghost</Button>
                    <Button size={size} variant="primary" disabled className="bg-primary text-white">Disabled</Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeSection === "inputs" && (
          <div>
            <SectionHeader title="Inputs" description="State default, valid, error, disabled, termasuk field dengan prefix/suffix." />
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Default</p>
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-primary">
                    Student Name
                    <input className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-accent" defaultValue="Amara Okafor" />
                  </label>
                  <label className="block text-xs font-semibold text-primary">
                    School
                    <select className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-accent" defaultValue="Greenfield Academy">
                      <option>Greenfield Academy</option>
                      <option>Riverside International</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-primary">
                    Search
                    <div className="relative mt-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input className="h-10 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Search by name or ID" />
                    </div>
                  </label>
                </div>
              </article>
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Validation</p>
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-emerald-700">
                    Valid Email
                    <input className="mt-1 h-10 w-full rounded-md border-2 border-emerald-400 bg-emerald-50 px-3 text-sm" defaultValue="parent@okafor.com" />
                  </label>
                  <label className="block text-xs font-semibold text-red-600">
                    Invalid Student ID
                    <input className="mt-1 h-10 w-full rounded-md border-2 border-red-400 bg-red-50 px-3 text-sm" defaultValue="STD-INVALID" />
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-normal text-red-500"><AlertTriangle className="h-3 w-3" /> Must match STD-YYYY-XXXX</span>
                  </label>
                  <label className="block text-xs font-semibold text-slate-400">
                    Disabled
                    <input disabled className="mt-1 h-10 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400" defaultValue="Auto-generated" />
                  </label>
                </div>
              </article>
            </div>
          </div>
        )}

        {activeSection === "badges" && (
          <div>
            <SectionHeader title="Badges" description="Menggunakan komponen Badge shared untuk status, plan, dan context table/card." />
            <div className="space-y-4">
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="active">Active</Badge>
                  <Badge variant="pending">Pending</Badge>
                  <Badge variant="suspended">Suspended</Badge>
                  <Badge variant="inactive">Inactive</Badge>
                  <Badge variant="trial">Trial</Badge>
                </div>
              </article>
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Plan</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="pro">Pro</Badge>
                  <Badge variant="enterprise">Enterprise</Badge>
                  <Badge variant="trial">Trial</Badge>
                </div>
              </article>
            </div>
          </div>
        )}

        {activeSection === "table" && (
          <div>
            <SectionHeader title="Data Table" description="Table filterable dengan status chip, row menu, dan pagination." />
            <div className="rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Search students..."
                      className="h-9 w-56 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as "all" | StudentStatus);
                      setPage(1);
                    }}
                    className="h-9 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
                  <Button size="sm" variant="primary" className="inline-flex items-center gap-1 bg-primary text-white hover:bg-slate-800" onClick={() => {
                    setModalMode("add");
                    setModalOpen(true);
                  }}>
                    <Plus className="h-3.5 w-3.5" />Add Student
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Grade <ArrowUpDown className="ml-1 inline h-3 w-3" /></th>
                      <th className="px-3 py-2">School <ArrowUpDown className="ml-1 inline h-3 w-3" /></th>
                      <th className="px-3 py-2">Enrolled</th>
                      <th className="px-3 py-2">Fee</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-slate-400">No student found.</td>
                      </tr>
                    ) : (
                      pagedStudents.map((student) => (
                        <tr key={student.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-3 font-semibold text-primary">{student.name}</td>
                          <td className="px-3 py-3 text-slate-600">{student.grade}</td>
                          <td className="px-3 py-3 text-slate-600">{student.school}</td>
                          <td className="px-3 py-3 text-slate-500">{student.enrolled}</td>
                          <td className="px-3 py-3 font-semibold text-primary">{student.fee}</td>
                          <td className="px-3 py-3"><Badge variant={statusVariant(student.status)}>{student.status}</Badge></td>
                          <td className="relative px-3 py-3 text-right">
                            <button
                              type="button"
                              aria-label={`Open actions for ${student.name}`}
                              onClick={() => setRowMenuOpen((prev) => (prev === student.id ? null : student.id))}
                              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-primary"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {rowMenuOpen === student.id ? (
                              <div className="absolute right-4 top-10 z-20 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
                                <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">View</button>
                                <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">Edit</button>
                                <button type="button" className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50">Delete</button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
                <p>
                  Showing {startIndex}-{endIndex} of {filteredStudents.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Go to previous page"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="rounded-md border border-slate-200 p-1 text-slate-500 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-primary">{page}</span>
                  <button
                    type="button"
                    aria-label="Go to next page"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="rounded-md border border-slate-200 p-1 text-slate-500 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "flags" && (
          <div>
            <SectionHeader title="Feature Flags" description="Kontrol aktivasi fitur tenant berdasarkan plan." />
            <div className="space-y-3">
              {flags.map((flag) => (
                <article key={flag.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${flag.enabled ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
                      <Zap className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-primary">{flag.label}</p>
                      <p className="text-xs text-slate-500">{flag.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={flag.tier === "enterprise" ? "enterprise" : flag.tier === "pro" ? "pro" : "trial"}>{flag.tier}</Badge>
                    <button
                      type="button"
                      aria-label={`Toggle ${flag.label}`}
                      onClick={() => setFlags((prev) => prev.map((item) => (item.id === flag.id ? { ...item, enabled: !item.enabled } : item)))}
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${flag.enabled ? "bg-accent" : "bg-slate-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${flag.enabled ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeSection === "modals" && (
          <div>
            <SectionHeader title="Modals" description="Dialog untuk tambah data dan edit subscription." />
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-slate-200 p-4 text-center">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Plus className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold text-primary">Add New Student</h3>
                <p className="mt-1 text-xs text-slate-500">Enrollment form dengan grade dan fee assignment.</p>
                <Button className="mt-4 bg-primary text-white hover:bg-slate-800" onClick={() => {
                  setModalMode("add");
                  setModalOpen(true);
                }}>
                  Open Add Student Modal
                </Button>
              </article>
              <article className="rounded-xl border border-slate-200 p-4 text-center">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <CreditCard className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold text-primary">Edit Subscription</h3>
                <p className="mt-1 text-xs text-slate-500">Ubah plan, modul, dan billing cycle tenant.</p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setModalMode("edit");
                  setModalOpen(true);
                }}>
                  Open Subscription Modal
                </Button>
              </article>
            </div>
            <article className="mt-4 rounded-xl border border-dashed border-slate-300 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Destructive Dialog Pattern</p>
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-700">Suspend Tenant Account</p>
                  <p className="text-xs text-red-600">Suspends all active users on this tenant. Action is reversible by super admin.</p>
                </div>
              </div>
            </article>
          </div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === "add" ? "Add New Student" : "Edit Subscription Plan"}>
        {modalMode === "add" ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-primary">
              Student Name
              <input className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-accent" defaultValue="Amara Okafor" />
            </label>
            <label className="block text-sm font-medium text-primary">
              Grade
              <select className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-accent" defaultValue="Grade 10">
                <option>Grade 7</option>
                <option>Grade 8</option>
                <option>Grade 9</option>
                <option>Grade 10</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" className="bg-primary text-white hover:bg-slate-800">Enroll Student</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-primary">
              Current Plan
              <select className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-accent" defaultValue="Pro">
                <option>Starter</option>
                <option>Pro</option>
                <option>Enterprise</option>
              </select>
            </label>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Active modules: Attendance, Fee Management, LMS Integration
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" className="bg-primary text-white hover:bg-slate-800">Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {rowMenuOpen !== null ? <div className="fixed inset-0 z-10" onClick={() => setRowMenuOpen(null)} /> : null}

      <footer className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          <span>Component coverage: Buttons, Inputs, Badges, Table, Flags, Modals.</span>
          <span className="mx-1">•</span>
          <Settings className="h-3.5 w-3.5" />
          <span>Built with shared UI components and Tailwind tokens.</span>
        </div>
      </footer>
    </div>
  );
}
