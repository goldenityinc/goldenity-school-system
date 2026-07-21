"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { useTenant } from "../../../components/tenant-context";
import { createClassroom, getClassrooms, getEmployees } from "../../actions/academic-gateway";

type ClassroomRow = {
  id: string;
  name?: string | null;
  code?: string | null;
  capacity?: number | null;
  academicYear?: string | null;
  homeroomTeacherName?: string | null;
  homeroomTeacher?: {
    name?: string | null;
    fullName?: string | null;
  } | null;
  teacher?: {
    name?: string | null;
    fullName?: string | null;
  } | null;
  maxStudents?: number | null;
  studentCount?: number | null;
};

type EmployeeRow = {
  id: string;
  name?: string | null;
  fullName?: string | null;
  nik?: string | null;
  nuptk?: string | null;
  role?: string | null;
};

type ClassroomResponse = ClassroomRow[] | { data?: ClassroomRow[] } | { classrooms?: ClassroomRow[] } | null;

type EmployeeResponse = EmployeeRow[] | { data?: EmployeeRow[] } | null;

type ClassroomFormState = {
  code: string;
  name: string;
  capacity: string;
  academicYear: string;
  homeroomTeacherId: string;
};

type FormErrors = Partial<Record<keyof ClassroomFormState, string>>;

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const initialFormState: ClassroomFormState = {
  code: "",
  name: "",
  capacity: "30",
  academicYear: "2026/2027",
  homeroomTeacherId: ""
};

const inputClassName = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-amber-400 focus:ring-2";

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

function ClassroomSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="h-5 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 space-y-2">
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function resolveTeacherName(classroom: ClassroomRow) {
  return classroom.homeroomTeacher?.name ?? classroom.homeroomTeacher?.fullName ?? classroom.teacher?.name ?? classroom.teacher?.fullName ?? classroom.homeroomTeacherName ?? "-";
}

function displayEmployeeLabel(employee: EmployeeRow) {
  return employee.name ?? employee.fullName ?? employee.nik ?? employee.nuptk ?? "-";
}

function isTeacher(employee: EmployeeRow) {
  return (employee.role ?? "").toUpperCase() === "GURU";
}

export default function ClassroomsPage() {
  const { selectedTenant, activeTenantLabel } = useTenant();
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(selectedTenant));
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [formState, setFormState] = useState<ClassroomFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const teacherOptions = useMemo(() => employees.filter(isTeacher), [employees]);

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

  const loadClassrooms = useCallback(async () => {
    if (!selectedTenant) {
      return [] as ClassroomRow[];
    }

    try {
      const rows = (await getClassrooms()) as ClassroomRow[];
      setClassrooms(rows);
      return rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data kelas.";
      setPageError(message);
      setClassrooms([]);
      return [] as ClassroomRow[];
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenant]);

  const loadEmployees = useCallback(async () => {
    if (!selectedTenant) {
      setEmployees([]);
      setTeacherError(null);
      setIsEmployeeLoading(false);
      return [] as EmployeeRow[];
    }

    try {
      const rows = (await getEmployees()) as EmployeeRow[];
      setEmployees(rows);
      return rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data guru.";
      setTeacherError(message);
      setEmployees([]);
      return [] as EmployeeRow[];
    } finally {
      setIsEmployeeLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadClassrooms();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadClassrooms]);

  function openModal() {
    setFormErrors({});
    setTeacherError(null);
    setIsModalOpen(true);
    setIsEmployeeLoading(true);
    void loadEmployees();
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormErrors({});
    setTeacherError(null);
    setFormState(initialFormState);
  }

  function updateField<K extends keyof ClassroomFormState>(key: K, value: ClassroomFormState[K]) {
    setFormState((previous) => ({ ...previous, [key]: value }));
    setFormErrors((previous) => ({ ...previous, [key]: undefined }));
    setPageError(null);
    setToast(null);
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!formState.code.trim()) nextErrors.code = "Kode kelas wajib diisi";
    if (!formState.name.trim()) nextErrors.name = "Nama kelas wajib diisi";

    const capacityValue = Number(formState.capacity);
    if (!formState.capacity.trim()) {
      nextErrors.capacity = "Kapasitas wajib diisi";
    } else if (!Number.isFinite(capacityValue) || capacityValue <= 0) {
      nextErrors.capacity = "Kapasitas harus lebih dari 0";
    }

    if (!formState.academicYear.trim()) nextErrors.academicYear = "Tahun ajaran wajib diisi";
    if (!formState.homeroomTeacherId.trim()) nextErrors.homeroomTeacherId = "Wali kelas wajib dipilih";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function resetForm() {
    setFormState(initialFormState);
    setFormErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenant) {
      setPageError("Sesi tenant tidak valid.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      setPageError(null);

      await createClassroom({
        code: formState.code.trim(),
        name: formState.name.trim(),
        capacity: Number(formState.capacity),
        academicYear: formState.academicYear.trim(),
        homeroomTeacherId: formState.homeroomTeacherId
      });

      await loadClassrooms();
      setToast({ type: "success", message: "Kelas berhasil ditambahkan." });
      resetForm();
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan kelas.";
      setToast({ type: "error", message });
      setPageError(message);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Akademik</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Manajemen Kelas</h1>
          <p className="mt-1 text-sm text-slate-600">Kelola kelas aktif untuk tenant {activeTenantLabel}.</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>+ Tambah Kelas</Button>
      </div>

      {pageError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</div> : null}

      {isLoading ? (
        <ClassroomSkeleton />
      ) : classrooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Belum ada data kelas untuk tenant ini.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classrooms.map((classroom) => {
            const capacity = classroom.capacity ?? classroom.maxStudents ?? classroom.studentCount ?? 0;

            return (
              <article key={classroom.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class Code</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{classroom.code ?? classroom.name ?? "-"}</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{capacity} siswa</span>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Class Name</dt>
                    <dd className="font-semibold text-slate-900">{classroom.name ?? classroom.code ?? "-"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Capacity</dt>
                    <dd className="font-semibold text-slate-900">{capacity}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Academic Year</dt>
                    <dd className="font-semibold text-slate-900">{classroom.academicYear ?? "-"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Homeroom Teacher</dt>
                    <dd className="max-w-[55%] truncate font-semibold text-slate-900">{resolveTeacherName(classroom)}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={isModalOpen} title="Tambah Kelas" onClose={closeModal} panelClassName="max-w-2xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Kode Kelas" htmlFor="classroom-code" error={formErrors.code}>
              <input
                id="classroom-code"
                value={formState.code}
                onChange={(event) => updateField("code", event.target.value)}
                className={inputClassName}
                placeholder="10IPA1"
              />
            </Field>

            <Field label="Nama Kelas" htmlFor="classroom-name" error={formErrors.name}>
              <input
                id="classroom-name"
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={inputClassName}
                placeholder="10 IPA 1"
              />
            </Field>

            <Field label="Kapasitas" htmlFor="classroom-capacity" error={formErrors.capacity}>
              <input
                id="classroom-capacity"
                type="number"
                min="1"
                value={formState.capacity}
                onChange={(event) => updateField("capacity", event.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Tahun Ajaran" htmlFor="classroom-academic-year" error={formErrors.academicYear}>
              <input
                id="classroom-academic-year"
                value={formState.academicYear}
                onChange={(event) => updateField("academicYear", event.target.value)}
                className={inputClassName}
                placeholder="2026/2027"
              />
            </Field>

            <Field label="Wali Kelas" htmlFor="classroom-homeroom-teacher" error={formErrors.homeroomTeacherId}>
              <select
                id="classroom-homeroom-teacher"
                value={formState.homeroomTeacherId}
                onChange={(event) => updateField("homeroomTeacherId", event.target.value)}
                className={inputClassName}
                disabled={isEmployeeLoading}
              >
                <option value="">{isEmployeeLoading ? "Memuat data guru..." : "Pilih wali kelas"}</option>
                {teacherOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {displayEmployeeLabel(employee)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {teacherError ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{teacherError}</div> : null}

          {!isEmployeeLoading && teacherOptions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Belum ada karyawan dengan role Guru untuk dipilih sebagai wali kelas.
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button variant="outline" type="button" onClick={closeModal} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || isEmployeeLoading}>
              {isSubmitting ? "Menyimpan..." : "Simpan Kelas"}
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