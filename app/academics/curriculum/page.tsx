"use client";

import { useEffect, useMemo, useState } from "react";
import { useTenant } from "../../../components/tenant-context";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";

type SubjectRow = {
  id: string;
  code?: string | null;
  name?: string | null;
  category?: string | null;
  kkm?: number | string | null;
  minimumPassingGrade?: number | string | null;
};

type SubjectResponse = SubjectRow[] | { data?: SubjectRow[] } | { subjects?: SubjectRow[] } | null;

type SubjectFormState = {
  code: string;
  name: string;
  category: string;
  kkm: string;
};

type FormErrors = Partial<Record<keyof SubjectFormState, string>>;

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const initialFormState: SubjectFormState = {
  code: "",
  name: "",
  category: "NASIONAL",
  kkm: "75"
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

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function normalizeCategory(value?: string | null) {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "NASIONAL") return "Nasional";
  if (normalized === "MUATAN_LOKAL" || normalized === "MULOK" || normalized === "MUATAN LOKAL") return "Muatan Lokal";
  if (normalized === "KEJURUAN") return "Kejuruan";
  return value ?? "-";
}

function resolveKkm(subject: SubjectRow) {
  return subject.kkm ?? subject.minimumPassingGrade ?? "-";
}

export default function CurriculumPage() {
  const { selectedTenant, activeTenantLabel } = useTenant();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [formState, setFormState] = useState<SubjectFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const totalSubjects = useMemo(() => subjects.length, [subjects]);

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
    const timer = window.setTimeout(() => {
      if (!selectedTenant) {
        setSubjects([]);
        setIsLoading(false);
        return;
      }

      void (async () => {
        try {
          setIsLoading(true);
          setPageError(null);

          const response = await fetch("/api/subjects", {
            method: "GET",
            headers: {
              "X-Tenant-Id": selectedTenant
            },
            cache: "no-store"
          });

          const payload = (await response.json().catch(() => null)) as SubjectResponse;

          if (!response.ok) {
            throw new Error((payload as { message?: string } | null)?.message ?? "Gagal memuat data mapel.");
          }

          const rows = Array.isArray(payload) ? payload : payload?.data ?? payload?.subjects ?? [];
          setSubjects(rows);
        } catch (error) {
          setPageError(error instanceof Error ? error.message : "Gagal memuat data mapel.");
          setSubjects([]);
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [selectedTenant]);

  function openModal() {
    setFormErrors({});
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormErrors({});
    setFormState(initialFormState);
  }

  function updateField<K extends keyof SubjectFormState>(key: K, value: SubjectFormState[K]) {
    setFormState((previous) => ({ ...previous, [key]: value }));
    setFormErrors((previous) => ({ ...previous, [key]: undefined }));
    setPageError(null);
    setToast(null);
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!formState.code.trim()) nextErrors.code = "Kode mapel wajib diisi";
    if (!formState.name.trim()) nextErrors.name = "Nama mapel wajib diisi";
    if (!formState.category.trim()) nextErrors.category = "Kategori wajib dipilih";

    const kkmValue = Number(formState.kkm);
    if (!formState.kkm.trim()) {
      nextErrors.kkm = "KKM wajib diisi";
    } else if (!Number.isFinite(kkmValue) || kkmValue <= 0) {
      nextErrors.kkm = "KKM harus lebih dari 0";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function refreshSubjects() {
    if (!selectedTenant) {
      return [] as SubjectRow[];
    }

    const response = await fetch("/api/subjects", {
      method: "GET",
      headers: {
        "X-Tenant-Id": selectedTenant
      },
      cache: "no-store"
    });

    const payload = (await response.json().catch(() => null)) as SubjectResponse;

    if (!response.ok) {
      throw new Error((payload as { message?: string } | null)?.message ?? "Gagal memuat data mapel.");
    }

    return Array.isArray(payload) ? payload : payload?.data ?? payload?.subjects ?? [];
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

    try {
      setPageError(null);

      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": selectedTenant
        },
        body: JSON.stringify({
          code: formState.code.trim(),
          name: formState.name.trim(),
          category: formState.category,
          kkm: Number(formState.kkm)
        })
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; message?: string; errors?: FormErrors } | null;

      if (!response.ok || payload?.success === false) {
        setFormErrors(payload?.errors ?? {});
        throw new Error(payload?.message ?? "Gagal menyimpan mapel.");
      }

      const rows = await refreshSubjects();
      setSubjects(rows);
      setToast({ type: "success", message: "Mata pelajaran berhasil ditambahkan." });
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan mapel.";
      setToast({ type: "error", message });
      setPageError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Akademik</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Kurikulum & Mapel</h1>
          <p className="mt-1 text-sm text-slate-600">Kelola daftar mata pelajaran aktif untuk tenant {activeTenantLabel}.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{totalSubjects}</span>
          </div>
          <Button onClick={openModal}>+ Tambah Mapel</Button>
        </div>
      </div>

      {pageError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</div> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-slate-50 p-8 text-center text-sm text-slate-500">Belum ada data mata pelajaran untuk tenant ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3">Kode Mapel</th>
                  <th className="border-b border-slate-200 px-4 py-3">Nama Mapel</th>
                  <th className="border-b border-slate-200 px-4 py-3">Kategori</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">KKM</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs font-semibold text-slate-800">{subject.code ?? "-"}</td>
                    <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">{subject.name ?? "-"}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{normalizeCategory(subject.category)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right font-semibold text-slate-900">{resolveKkm(subject)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={isModalOpen} title="Tambah Mapel" onClose={closeModal} panelClassName="max-w-2xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Kode Mapel" htmlFor="subject-code" error={formErrors.code}>
              <input id="subject-code" value={formState.code} onChange={(event) => updateField("code", event.target.value)} className={inputClassName} placeholder="MTK" />
            </Field>

            <Field label="Nama Mapel" htmlFor="subject-name" error={formErrors.name}>
              <input id="subject-name" value={formState.name} onChange={(event) => updateField("name", event.target.value)} className={inputClassName} placeholder="Matematika" />
            </Field>

            <Field label="Kategori" htmlFor="subject-category" error={formErrors.category}>
              <select id="subject-category" value={formState.category} onChange={(event) => updateField("category", event.target.value)} className={inputClassName}>
                <option value="NASIONAL">Nasional</option>
                <option value="MUATAN_LOKAL">Muatan Lokal</option>
                <option value="KEJURUAN">Kejuruan</option>
              </select>
            </Field>

            <Field label="KKM" htmlFor="subject-kkm" error={formErrors.kkm}>
              <input id="subject-kkm" type="number" min="1" value={formState.kkm} onChange={(event) => updateField("kkm", event.target.value)} className={inputClassName} />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button variant="outline" type="button" onClick={closeModal} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Mapel"}
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