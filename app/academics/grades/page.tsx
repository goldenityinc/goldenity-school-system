"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { useTenant } from "../../../contexts/TenantContext";
import {
  createGrade,
  deleteGrade,
  getGrades,
  getOptionsForGradeForm,
  updateGrade,
  type CreateGradeInput,
  type GradeListRow
} from "../../../actions/grades";

type Option = { id: string; label: string };
type ScheduleOption = Option & { courseId: string };

type FormErrors = Partial<Record<keyof CreateGradeInput | "general", string>>;

function showSubmissionError(
  message: string,
  setToast: (v: { type: "error" | "success"; message: string } | null) => void,
  setFormErrors?: (v: FormErrors) => void,
  overrideErrors?: FormErrors
) {
  setToast({ type: "error", message });

  if (setFormErrors) {
    setFormErrors({
      ...(overrideErrors ?? {}),
      general: overrideErrors?.general ?? "Submit gagal. Coba lagi."
    });
  }

  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

const EMPTY_FORM_STATE: CreateGradeInput = {
  studentId: "",
  courseId: "",
  courseOfferingId: "",
  type: "UTS",
  score: 0,
  notes: ""
};

const DEFAULT_GRADE_TYPES = ["UH", "UTS", "UAS", "Tugas", "Proyek", "Praktikum", "Keterampilan"];

export default function GradesPage() {
  const { selectedTenant } = useTenant();
  const pathname = usePathname();

  const routeTenantSlug = useMemo(() => {
    const match = typeof pathname === "string" ? /^\/school-erp\/([^/]+)(?:\/|$)/.exec(pathname) : null;
    return match ? decodeURIComponent(match[1]) : "";
  }, [pathname]);

  const tenantScope = useMemo(() => {
    return routeTenantSlug || selectedTenant || "";
  }, [routeTenantSlug, selectedTenant]);

  const [grades, setGrades] = useState<GradeListRow[]>([]);
  const [studentOptions, setStudentOptions] = useState<Option[]>([]);
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOption[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formState, setFormState] = useState<CreateGradeInput>(EMPTY_FORM_STATE);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const loadGrades = useCallback(async () => {
    if (!tenantScope) {
      setGrades([]);
      return;
    }
    setIsLoading(true);
    setPageError(null);
    try {
      const data = await getGrades(tenantScope, searchQuery);
      setGrades(data);
    } catch (error) {
      console.error("[GradesPage.loadGrades]", error);
      setPageError("Gagal memuat data nilai. Silakan refresh halaman.");
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenantScope, searchQuery]);

  const loadOptions = useCallback(async () => {
    if (!tenantScope) {
      setStudentOptions([]);
      setCourseOptions([]);
      setScheduleOptions([]);
      return;
    }
    setIsOptionsLoading(true);
    try {
      const { students, courses, schedules } = await getOptionsForGradeForm(tenantScope);
      setStudentOptions(students);
      setCourseOptions(courses);
      setScheduleOptions(schedules as ScheduleOption[]);
    } catch (error) {
      console.error("[GradesPage.loadOptions]", error);
    } finally {
      setIsOptionsLoading(false);
    }
  }, [tenantScope]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      loadGrades();
    }, 200);
    return () => window.clearTimeout(t);
  }, [loadGrades]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      loadOptions();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadOptions]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const openCreateModal = () => {
    setEditingGradeId(null);
    setFormState(EMPTY_FORM_STATE);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (row: GradeListRow) => {
    setEditingGradeId(row.id);
    setFormState({
      studentId: row.student?.id ?? "",
      courseId: row.course?.id ?? "",
      courseOfferingId: row.schedule?.id ?? "",
      type: row.type || "UTS",
      score: row.score,
      notes: row.notes ?? ""
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGradeId(null);
    setFormState(EMPTY_FORM_STATE);
    setFormErrors({});
  };

  const updateField = <K extends keyof CreateGradeInput>(key: K, value: CreateGradeInput[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formState.studentId) errors.studentId = "Murid wajib dipilih";
    if (!formState.courseId) errors.courseId = "Mata pelajaran wajib dipilih";
    if (!formState.type) errors.type = "Tipe penilaian wajib diisi";
    if (typeof formState.score !== "number" || Number.isNaN(formState.score)) {
      errors.score = "Nilai harus berupa angka";
    } else if (formState.score < 0 || formState.score > 100) {
      errors.score = "Nilai harus 0 - 100";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!tenantScope) {
      showSubmissionError("Tenant belum dipilih. Pilih tenant dari dashboard atau lewat URL.", setToast, setFormErrors);
      return;
    }
    if (!validateForm()) {
      showSubmissionError(
        "Perbaiki error di form terlebih dahulu.",
        setToast,
        setFormErrors,
        { ...formErrors, general: "Perbaiki error di form." }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateGradeInput = {
        studentId: formState.studentId,
        courseId: formState.courseId,
        courseOfferingId: formState.courseOfferingId || undefined,
        type: formState.type,
        score: Number(formState.score),
        notes: formState.notes || undefined
      };

      const result = editingGradeId
        ? await updateGrade(tenantScope, editingGradeId, payload)
        : await createGrade(tenantScope, payload);

      if (!result.success) {
        showSubmissionError(
          result.message ?? "Gagal menyimpan nilai.",
          setToast,
          setFormErrors,
          result.errors
        );
        return;
      }

      setToast({
        type: "success",
        message: editingGradeId ? "Nilai berhasil diperbarui." : "Nilai berhasil ditambahkan."
      });
      closeModal();
      startTransition(() => {
        loadGrades();
      });
    } catch (error) {
      console.error("[GradesPage.handleSubmit]", error);
      showSubmissionError(
        "Terjadi kesalahan tak terduga saat menyimpan nilai.",
        setToast,
        setFormErrors
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId || !tenantScope) return;
    startDeleteTransition(async () => {
      try {
        await deleteGrade(deletingId, tenantScope);
        setToast({ type: "success", message: "Nilai berhasil dihapus." });
        setDeletingId(null);
        await loadGrades();
      } catch (error) {
        console.error("[GradesPage.confirmDelete]", error);
        const msg = error instanceof Error ? error.message : "Gagal menghapus nilai.";
        showSubmissionError(msg, setToast);
        setDeletingId(null);
      }
    });
  };

  const scoreBadgeClass = (score: number) => {
    if (score >= 85) return "bg-emerald-100 text-emerald-800";
    if (score >= 70) return "bg-sky-100 text-sky-800";
    if (score >= 60) return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  };

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Akademik</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Penilaian (Nilai)</h1>
          <p className="mt-1 text-sm text-slate-600">Kelola nilai murid per mata pelajaran dan jadwal pengampu.</p>
        </div>
        <Button onClick={openCreateModal} disabled={!tenantScope || isLoading || isOptionsLoading}>
          <Plus className="mr-1.5 h-4 w-4" />
          Tambah Nilai
        </Button>
      </header>

      {toast ? (
        <div
          className={
            "rounded-lg border px-4 py-3 text-sm shadow-sm " +
            (toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800")
          }
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari murid, mapel, tipe nilai, atau catatan..."
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {pageError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {pageError}
          <button
            type="button"
            onClick={loadGrades}
            className="ml-3 text-xs font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-900"
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Murid</th>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Nilai</th>
              <th className="px-4 py-3">Jadwal / Pengajar</th>
              <th className="px-4 py-3">Catatan</th>
              <th className="px-4 py-3">Dibuat</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  {Array.from({ length: 8 }).map((__, jdx) => (
                    <td key={jdx} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : grades.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                  Belum ada data nilai untuk tenant ini.
                </td>
              </tr>
            ) : (
              grades.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.student?.name ?? "-"}</div>
                    {row.student?.nis ? (
                      <div className="text-xs text-slate-500">NIS {row.student.nis}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.course?.name ?? "-"}</div>
                    {row.course?.code ? (
                      <div className="text-xs text-slate-500">Kode: {row.course.code}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-bold ${scoreBadgeClass(row.score)}`}>
                      {row.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-800">
                      {row.schedule?.term
                        ? `${row.schedule.term}${row.schedule.academicYear ? ` · TA ${row.schedule.academicYear}` : ""}`
                        : "-"}
                    </div>
                    {row.schedule?.dayOfWeek ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {row.schedule.dayOfWeek}{" "}
                        {row.schedule.startTime || row.schedule.endTime
                          ? `${row.schedule.startTime ?? ""}-${row.schedule.endTime ?? ""}`
                          : ""}
                        {row.schedule.lecturerName ? ` · ${row.schedule.lecturerName}` : ""}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="line-clamp-2 text-sm text-slate-700">{row.notes ?? "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString("id-ID") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(row.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingGradeId ? "Edit Nilai" : "Tambah Nilai"}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="grade-student" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Murid <span className="text-rose-600">*</span>
            </label>
            <select
              id="grade-student"
              value={formState.studentId}
              onChange={(e) => updateField("studentId", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
              disabled={isOptionsLoading || isSubmitting || isPending}
            >
              <option value="">{isOptionsLoading ? "Memuat murid..." : "Pilih murid"}</option>
              {studentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {formErrors.studentId ? (
              <p className="mt-1 text-xs text-rose-600">{formErrors.studentId}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="grade-course" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Mata Pelajaran <span className="text-rose-600">*</span>
            </label>
            <select
              id="grade-course"
              value={formState.courseId}
              onChange={(e) => updateField("courseId", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
              disabled={isOptionsLoading || isSubmitting || isPending}
            >
              <option value="">{isOptionsLoading ? "Memuat mapel..." : "Pilih mata pelajaran"}</option>
              {courseOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {formErrors.courseId ? (
              <p className="mt-1 text-xs text-rose-600">{formErrors.courseId}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="grade-schedule" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Jadwal Pengampu <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <select
              id="grade-schedule"
              value={formState.courseOfferingId ?? ""}
              onChange={(e) => updateField("courseOfferingId", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
              disabled={isOptionsLoading || isSubmitting || isPending}
            >
              <option value="">Otomatis (pilih jadwal pertama untuk mapel)</option>
              {scheduleOptions
                .filter((s) => !formState.courseId || s.courseId === formState.courseId)
                .map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
            </select>
            {formErrors.courseOfferingId ? (
              <p className="mt-1 text-xs text-rose-600">{formErrors.courseOfferingId}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="grade-type" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Tipe Penilaian <span className="text-rose-600">*</span>
            </label>
            <select
              id="grade-type"
              value={formState.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
              disabled={isSubmitting || isPending}
            >
              {DEFAULT_GRADE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {formErrors.type ? <p className="mt-1 text-xs text-rose-600">{formErrors.type}</p> : null}
          </div>

          <div>
            <label htmlFor="grade-score" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Nilai (0 - 100) <span className="text-rose-600">*</span>
            </label>
            <input
              id="grade-score"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={formState.score}
              onChange={(e) => updateField("score", e.target.value as unknown as number)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
              disabled={isSubmitting || isPending}
            />
            {formErrors.score ? <p className="mt-1 text-xs text-rose-600">{formErrors.score}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="grade-notes" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Catatan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              id="grade-notes"
              rows={3}
              value={formState.notes ?? ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Keterangan tambahan (maks 1000 karakter)"
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
              disabled={isSubmitting || isPending}
            />
            {formErrors.notes ? <p className="mt-1 text-xs text-rose-600">{formErrors.notes}</p> : null}
          </div>

          {formErrors.general ? (
            <div className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {formErrors.general}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-2 md:flex-row">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={isSubmitting || isPending}
          >
            Batal
          </button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isPending || isOptionsLoading}
          >
            {isSubmitting || isPending ? "Menyimpan..." : editingGradeId ? "Simpan Perubahan" : "Simpan Nilai"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Hapus Nilai"
        description="Tindakan ini tidak bisa dibatalkan. Pastikan nilai yang dihapus sudah benar."
      >
        <p className="text-sm text-slate-700">
          Nilai terpilih akan dihapus secara permanen dari sistem. Data murid dan mata pelajaran lainnya{" "}
          <span className="font-semibold text-slate-900">tidak</span> akan terpengaruh.
        </p>
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 md:flex-row">
          <button
            type="button"
            onClick={() => setDeletingId(null)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={isDeleting}
          >
            Batal
          </button>
          <Button
            onClick={confirmDelete}
            tone="danger"
            disabled={isDeleting}
          >
            {isDeleting ? "Menghapus..." : "Hapus Nilai"}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
