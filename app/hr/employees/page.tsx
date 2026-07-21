"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTenant } from "../../../components/tenant-context";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { createEmployee, getEmployees } from "../../actions/academic-gateway";

type EmployeeRow = {
  id: string;
  name: string;
  nik?: string | null;
  nuptk?: string | null;
  role?: string | null;
  status?: string | null;
};

type EmployeeFormState = {
  name: string;
  nik: string;
  nuptk: string;
  email: string;
  phone: string;
  gender: string;
  role: string;
  status: string;
};

type FormErrors = Partial<Record<keyof EmployeeFormState, string>>;

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const initialFormState: EmployeeFormState = {
  name: "",
  nik: "",
  nuptk: "",
  email: "",
  phone: "",
  gender: "",
  role: "GURU",
  status: "ACTIVE"
};

function displayRole(value?: string | null) {
  if (!value) return "-";

  const normalized = value.toUpperCase();
  if (normalized === "KEPSEK" || normalized === "HEADMASTER" || normalized === "PRINCIPAL") return "Kepsek";
  if (normalized === "GURU" || normalized === "TEACHER") return "Guru";
  if (normalized === "ADMIN" || normalized === "STAFF" || normalized === "TENANT_ADMIN") return "Admin";
  return value;
}

function displayStatus(value?: string | null) {
  if (!value) return "-";

  const normalized = value.toUpperCase();
  if (["ACTIVE", "AKTIF", "1", "TRUE"].includes(normalized)) return "Aktif";
  if (["INACTIVE", "NONAKTIF", "NON_AKTIF", "0", "FALSE"].includes(normalized)) return "Nonaktif";
  return value;
}

function statusClassName(value?: string | null) {
  const normalized = (value ?? "").toUpperCase();
  if (["ACTIVE", "AKTIF", "1", "TRUE"].includes(normalized)) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (["INACTIVE", "NONAKTIF", "NON_AKTIF", "0", "FALSE"].includes(normalized)) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-11 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

const inputClassName = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2";

export default function EmployeeManagementPage() {
  const { selectedTenant, activeTenantLabel } = useTenant();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<EmployeeFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  const totalEmployees = useMemo(() => employees.length, [employees]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  useEffect(() => {
    let isActive = true;

    if (!selectedTenant) {
      return () => {
        isActive = false;
      };
    }

    async function loadEmployees() {
      try {
        setIsLoading(true);
        setPageError(null);
        const rows = (await getEmployees()) as EmployeeRow[];

        if (!isActive) {
          return;
        }

        setEmployees(rows);
      } catch (error) {
        if (isActive) {
          setPageError(error instanceof Error ? error.message : "Gagal memuat data karyawan.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      isActive = false;
    };
  }, [selectedTenant]);

  function openModal() {
    setFormErrors({});
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormErrors({});
  }

  function updateField<K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]) {
    setFormState((previous) => ({ ...previous, [key]: value }));
    setFormErrors((previous) => ({ ...previous, [key]: undefined }));
    setPageError(null);
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!formState.name.trim()) nextErrors.name = "Nama wajib diisi";
    if (!formState.nik.trim()) nextErrors.nik = "NIK wajib diisi";
    if (!formState.email.trim()) nextErrors.email = "Email wajib diisi";
    if (!formState.role.trim()) nextErrors.role = "Role wajib dipilih";
    if (!formState.status.trim()) nextErrors.status = "Status wajib dipilih";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function refreshEmployees(tenantId: string) {
    void tenantId;
    return getEmployees().then((rows) => rows as EmployeeRow[]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenant) {
      setPageError("Sesi tenant tidak valid.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        setPageError(null);

        await createEmployee({
          name: formState.name.trim(),
          nik: formState.nik.trim(),
          nuptk: formState.nuptk.trim() || null,
          email: formState.email.trim(),
          phone: formState.phone.trim() || null,
          gender: formState.gender || null,
          role: formState.role,
          status: formState.status
        });

        const rows = await refreshEmployees(selectedTenant);
        setEmployees(rows);
        setToast({ type: "success", message: "Karyawan berhasil ditambahkan." });
        setFormState(initialFormState);
        closeModal();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menyimpan karyawan.";
        setToast({ type: "error", message });
        setPageError(message);
      }
    });
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">HR</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Manajemen Karyawan</h1>
          <p className="mt-1 text-sm text-slate-600">Kelola data karyawan tenant {activeTenantLabel} dari satu layar.</p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Total: <span className="font-semibold text-slate-900">{totalEmployees}</span>
          <Button onClick={openModal}>+ Tambah Karyawan</Button>
        </div>
      </div>

      {pageError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</div> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2">NIK / NUPTK</th>
                <th className="border-b border-slate-200 px-3 py-2">Nama</th>
                <th className="border-b border-slate-200 px-3 py-2">Role</th>
                <th className="border-b border-slate-200 px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-500" colSpan={4}>
                    Belum ada data karyawan untuk tenant ini.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">
                      {employee.nik ?? employee.nuptk ?? "-"}
                      {employee.nik && employee.nuptk ? <span className="ml-2 text-[11px] text-slate-400">/ {employee.nuptk}</span> : null}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{employee.name}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{displayRole(employee.role)}</td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassName(employee.status)}`}>
                        {displayStatus(employee.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={isModalOpen} title="Tambah Karyawan" onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" htmlFor="employee-name" error={formErrors.name}>
              <input id="employee-name" value={formState.name} onChange={(event) => updateField("name", event.target.value)} className={inputClassName} />
            </Field>
            <Field label="NIK" htmlFor="employee-nik" error={formErrors.nik}>
              <input id="employee-nik" value={formState.nik} onChange={(event) => updateField("nik", event.target.value)} className={inputClassName} />
            </Field>
            <Field label="NUPTK" htmlFor="employee-nuptk" error={formErrors.nuptk}>
              <input id="employee-nuptk" value={formState.nuptk} onChange={(event) => updateField("nuptk", event.target.value)} className={inputClassName} />
            </Field>
            <Field label="Email" htmlFor="employee-email" error={formErrors.email}>
              <input id="employee-email" type="email" value={formState.email} onChange={(event) => updateField("email", event.target.value)} className={inputClassName} />
            </Field>
            <Field label="Phone" htmlFor="employee-phone" error={formErrors.phone}>
              <input id="employee-phone" value={formState.phone} onChange={(event) => updateField("phone", event.target.value)} className={inputClassName} />
            </Field>
            <Field label="Gender" htmlFor="employee-gender" error={formErrors.gender}>
              <select id="employee-gender" value={formState.gender} onChange={(event) => updateField("gender", event.target.value)} className={inputClassName}>
                <option value="">Pilih gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </Field>
            <Field label="Role" htmlFor="employee-role" error={formErrors.role}>
              <select id="employee-role" value={formState.role} onChange={(event) => updateField("role", event.target.value)} className={inputClassName}>
                <option value="KEPSEK">Kepsek</option>
                <option value="GURU">Guru</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            <Field label="Status" htmlFor="employee-status" error={formErrors.status}>
              <select id="employee-status" value={formState.status} onChange={(event) => updateField("status", event.target.value)} className={inputClassName}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Karyawan"}
            </Button>
          </div>
        </form>
      </Modal>

      {toast ? (
        <div className="fixed right-4 top-4 z-[60] w-[min(92vw,360px)] rounded-xl border bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className={`mb-2 h-1.5 w-16 rounded-full ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
          <p className="text-sm font-semibold text-slate-900">{toast.type === "success" ? "Berhasil" : "Gagal"}</p>
          <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
        </div>
      ) : null}
    </section>
  );
}