"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { useTenant } from "../../../components/tenant-context";
import {
  createSchedule,
  deleteSchedule,
  getOptionsForScheduleForm,
  getSchedules,
  updateSchedule,
  type ScheduleListRow
} from "../../actions/schedules";
import type { CreateCourseOfferingInput } from "../../../lib/academics-schema";

type Option = { id: string; label: string };

type FormState = CreateCourseOfferingInput;
type FormErrors = Partial<Record<keyof FormState | "general", string>>;
type ToastState = { type: "success" | "error"; message: string } | null;

const initialFormState: FormState = {
  courseId: "",
  lecturerId: "",
  classroomId: "",
  dayOfWeek: "Senin",
  startTime: "07:00",
  endTime: "08:30",
  room: ""
};

const inputClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-amber-400 focus:ring-2";

const selectClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-amber-400 focus:ring-2";

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

function TableSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function showSubmissionError(message: string, setToast: (t: ToastState) => void, setFormErrors?: (e: FormErrors) => void) {
  setToast({ type: "error", message });
  setFormErrors?.({ general: message });
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export default function SchedulesPage() {
  const pathname = usePathname();
  const { selectedTenant, activeTenantLabel } = useTenant();
  const routeTenantSlug = useMemo(() => {
    const match = pathname.match(/^\/school-erp\/([^/]+)(?:\/|$)/);
    const slug = match ? decodeURIComponent(match[1] ?? "") : "";
    return slug.trim();
  }, [pathname]);
  const tenantScope = routeTenantSlug || selectedTenant;

  const [schedules, setSchedules] = useState<ScheduleListRow[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [lecturers, setLecturers] = useState<Option[]>([]);
  const [classrooms, setClassrooms] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadSchedules = useCallback(async () => {
    if (!tenantScope) {
      setIsLoading(false);
      setSchedules([]);
      return;
    }
    try {
      setIsLoading(true);
      setPageError(null);
      const rows = await getSchedules(tenantScope, searchQuery);
      setSchedules(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data jadwal pelajaran.";
      setPageError(message);
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenantScope, searchQuery]);

  const loadOptions = useCallback(async () => {
    if (!tenantScope) {
      setCourses([]);
      setLecturers([]);
      setClassrooms([]);
      return;
    }
    try {
      setIsOptionsLoading(true);
      const opts = await getOptionsForScheduleForm(tenantScope);
      setCourses(
        opts.courses.map((c) => ({
          id: c.id,
          label: `${c.code ? `[${c.code}] ` : ""}${c.name}`
        }))
      );
      setLecturers(
        opts.lecturers.map((l) => ({
          id: l.id,
          label: `${l.staffId ? `(${l.staffId}) ` : ""}${l.fullName ?? "Guru"}`
        }))
      );
      setClassrooms(
        opts.classrooms.map((c) => ({
          id: c.id,
          label: `${c.code ? `[${c.code}] ` : ""}${c.name}${c.academicYear ? ` (${c.academicYear} Smt.${c.semester})` : ""}`
        }))
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat opsi jadwal.";
      setToast({ type: "error", message });
    } finally {
      setIsOptionsLoading(false);
    }
  }, [tenantScope]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  function openCreateModal() {
    setEditingScheduleId(null);
    setFormState(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(row: ScheduleListRow) {
    setEditingScheduleId(row.id);
    setFormState({
      courseId: row.course?.id ?? "",
      lecturerId: row.lecturer?.id ?? "",
      classroomId: row.classroom?.id ?? "",
      dayOfWeek: (row.dayOfWeek as FormState["dayOfWeek"]) ?? "Senin",
      startTime: row.startTime ?? "07:00",
      endTime: row.endTime ?? "08:30",
      room: row.room ?? ""
    });
    setFormErrors({});
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormState(initialFormState);
    setFormErrors({});
    setEditingScheduleId(null);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }));
    setPageError(null);
  }

  async function submitForm() {
    if (!tenantScope) {
      showSubmissionError("Tenant belum terdeteksi. Silakan login ulang.", setToast, setFormErrors);
      return;
    }
    setIsSubmitting(true);
    setFormErrors({});
    try {
      const result = editingScheduleId
        ? await updateSchedule(tenantScope, editingScheduleId, formState)
        : await createSchedule(tenantScope, formState);

      if (!result.success) {
        showSubmissionError(result.message ?? "Gagal menyimpan jadwal.", setToast, (errors) => {
          setFormErrors({ ...(result.errors ?? {}), ...(errors ?? {}) });
        });
        setFormErrors((prev) => ({ ...prev, ...(result.errors ?? {}) }));
        return;
      }

      setToast({
        type: "success",
        message: editingScheduleId ? "Jadwal pelajaran berhasil diperbarui." : "Jadwal pelajaran berhasil ditambahkan."
      });
      closeModal();
      void loadSchedules();
    } catch (error) {
      showSubmissionError(
        error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan jadwal.",
        setToast,
        setFormErrors
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(row: ScheduleListRow) {
    setDeletingId(row.id);
  }

  async function executeDelete() {
    if (!tenantScope || !deletingId) {
      setDeletingId(null);
      return;
    }
    try {
      await deleteSchedule(deletingId, tenantScope);
      setToast({ type: "success", message: "Jadwal pelajaran berhasil dihapus." });
      void loadSchedules();
    } catch (error) {
      showSubmissionError(
        error instanceof Error ? error.message : "Gagal menghapus jadwal pelajaran.",
        setToast
      );
    } finally {
      setDeletingId(null);
    }
  }

  function cancelDelete() {
    setDeletingId(null);
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Akademik</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Jadwal Pelajaran</h1>
          <p className="mt-1 text-sm text-slate-600">
            {activeTenantLabel ? `Tenant: ${activeTenantLabel}` : "Kelola jadwal pelajaran per tenant sekolah."}
          </p>
        </div>
        <Button onClick={openCreateModal} disabled={!tenantScope || isOptionsLoading}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Jadwal
        </Button>
      </header>

      {toast ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm shadow-soft ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mapel, guru, kelas, ruang, hari..."
            className={`h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-amber-400 focus:ring-2`}
          />
        </div>
      </div>

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{pageError}</div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Mata Pelajaran</th>
                <th className="px-4 py-3 text-left">Guru Pengajar</th>
                <th className="px-4 py-3 text-left">Kelas</th>
                <th className="px-4 py-3 text-left">Hari / Jam</th>
                <th className="px-4 py-3 text-left">Ruang</th>
                <th className="px-4 py-3 text-left">Term / TA</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton />
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Belum ada jadwal pelajaran untuk tenant ini.
                  </td>
                </tr>
              ) : (
                schedules.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3 text-slate-900">
                      <div className="font-medium">
                        {row.course?.code ? <span className="text-slate-500">[{row.course.code}]</span> : null}{" "}
                        {row.course?.name ?? "-"}
                      </div>
                      {row.section ? <div className="text-xs text-slate-500">Kelas {row.section}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{row.lecturer?.fullName ?? "-"}</div>
                      {row.lecturer?.staffId ? (
                        <div className="text-xs text-slate-500">NIP: {row.lecturer.staffId}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>
                        {row.classroom?.code ? <span className="text-slate-500">[{row.classroom.code}]</span> : null}{" "}
                        {row.classroom?.name ?? "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{row.dayOfWeek ?? "-"}</div>
                      <div className="text-xs text-slate-500">
                        {row.startTime ?? "-"} – {row.endTime ?? "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.room ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{row.academicYear || "-"}</div>
                      {row.term ? <div className="text-xs text-slate-500">{row.term}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(row)}
                          aria-label="Edit jadwal"
                        >
                          <Pencil className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(row)}
                          aria-label="Hapus jadwal"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={isModalOpen} onClose={closeModal} title={editingScheduleId ? "Edit Jadwal Pelajaran" : "Tambah Jadwal Pelajaran"}>
        <div className="space-y-4 p-4">
          {formErrors.general ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formErrors.general}</div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Mata Pelajaran" htmlFor="courseId" error={formErrors.courseId}>
              <select
                id="courseId"
                name="courseId"
                value={formState.courseId}
                onChange={(e) => updateField("courseId", e.target.value)}
                className={selectClassName}
              >
                <option value="">Pilih mata pelajaran...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Guru Pengajar" htmlFor="lecturerId" error={formErrors.lecturerId}>
              <select
                id="lecturerId"
                name="lecturerId"
                value={formState.lecturerId}
                onChange={(e) => updateField("lecturerId", e.target.value)}
                className={selectClassName}
              >
                <option value="">Pilih guru...</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Kelas (Rombel)" htmlFor="classroomId" error={formErrors.classroomId}>
              <select
                id="classroomId"
                name="classroomId"
                value={formState.classroomId}
                onChange={(e) => updateField("classroomId", e.target.value)}
                className={selectClassName}
              >
                <option value="">Tidak ada kelas (opsional)</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Hari" htmlFor="dayOfWeek" error={formErrors.dayOfWeek}>
              <select
                id="dayOfWeek"
                name="dayOfWeek"
                value={formState.dayOfWeek}
                onChange={(e) => updateField("dayOfWeek", e.target.value as FormState["dayOfWeek"])}
                className={selectClassName}
              >
                {(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Jam Mulai (HH:MM)" htmlFor="startTime" error={formErrors.startTime}>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={formState.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Jam Selesai (HH:MM)" htmlFor="endTime" error={formErrors.endTime}>
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={formState.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Ruang (opsional)" htmlFor="room" error={formErrors.room}>
              <input
                id="room"
                name="room"
                type="text"
                value={formState.room ?? ""}
                onChange={(e) => updateField("room", e.target.value)}
                placeholder="contoh: R-101, Lab-Kimia"
                className={inputClassName}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-100 pt-4 md:flex-row md:items-center">
            <Button variant="ghost" onClick={closeModal} disabled={isSubmitting || isPending}>
              Batal
            </Button>
            <Button
              onClick={() => {
                startTransition(() => {
                  void submitForm();
                });
              }}
              disabled={isSubmitting || isPending || isOptionsLoading}
            >
              {isSubmitting || isPending ? "Menyimpan..." : editingScheduleId ? "Simpan Perubahan" : "Simpan Jadwal"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(deletingId)} onClose={cancelDelete} title="Hapus Jadwal Pelajaran">
        <div className="space-y-4 p-4 text-sm">
          <p className="text-slate-700">
            Apakah Anda yakin ingin menghapus jadwal ini? Data enrollment dan nilai yang terhubung dengan jadwal ini
            juga akan dihapus secara otomatis.
          </p>
          <div className="flex flex-col-reverse items-stretch justify-end gap-2 md:flex-row md:items-center">
            <Button variant="ghost" onClick={cancelDelete}>
              Batal
            </Button>
            <Button
              onClick={() => {
                startTransition(() => {
                  void executeDelete();
                });
              }}
            >
              {isPending ? "Menghapus..." : "Hapus Jadwal"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
