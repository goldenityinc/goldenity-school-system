"use client";

import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CreateStudentInput } from "../../../lib/student-schema";

type StudentWizardFormState = {
  nis: string;
  name: string;
  gender: string;
  placeOfBirth: string;
  dateOfBirth: string;
  address: string;
  fatherName: string;
  motherName: string;
  parentPhone: string;
  parentJob: string;
  previousSchool: string;
  previousReportCardSummary: string;
};

type FieldErrors = {
  name?: string;
  nis?: string;
};

const initialFormState: StudentWizardFormState = {
  nis: "",
  name: "",
  gender: "",
  placeOfBirth: "",
  dateOfBirth: "",
  address: "",
  fatherName: "",
  motherName: "",
  parentPhone: "",
  parentJob: "",
  previousSchool: "",
  previousReportCardSummary: ""
};

const steps = [
  { id: 1, label: "Data Pribadi" },
  { id: 2, label: "Orang Tua/Wali" },
  { id: 3, label: "Riwayat Akademik" }
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid gap-3 md:grid-cols-3">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isDone = step.id < currentStep;

        return (
          <li
            key={step.id}
            className={`rounded-xl border p-4 ${isActive ? "border-slate-900 bg-slate-900 text-white" : isDone ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}
          >
            <p className="text-xs uppercase tracking-wide">Langkah {step.id}</p>
            <p className="mt-1 text-sm font-semibold">{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
}

export default function NewStudentWizardPage() {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<StudentWizardFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const stepTitle = useMemo(() => steps.find((step) => step.id === currentStep)?.label ?? "", [currentStep]);

  function updateField<K extends keyof StudentWizardFormState>(key: K, value: StudentWizardFormState[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "name" || key === "nis") {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validateStepOne() {
    const nextErrors: FieldErrors = {};

    if (!formData.nis.trim()) {
      nextErrors.nis = "NIS wajib diisi";
    }

    if (!formData.name.trim()) {
      nextErrors.name = "Nama wajib diisi";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (currentStep === 1 && !validateStepOne()) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  function formatDateForDisplay(value: string) {
    if (!value) {
      return "";
    }

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function openDatePicker() {
    const dateInput = dateInputRef.current;
    if (!dateInput) {
      return;
    }

    if (typeof dateInput.showPicker === "function") {
      dateInput.showPicker();
      return;
    }

    dateInput.click();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateStepOne()) {
      setCurrentStep(1);
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);

        const payload: CreateStudentInput = {
          name: formData.name,
          nis: formData.nis,
          gender: formData.gender,
          placeOfBirth: formData.placeOfBirth,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          parentPhone: formData.parentPhone,
          parentJob: formData.parentJob,
          previousSchool: formData.previousSchool,
          previousReportCard: formData.previousReportCardSummary.trim()
            ? { summary: formData.previousReportCardSummary.trim() }
            : null
        };

        const response = await fetch("/api/students", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; message?: string; errors?: FieldErrors }
          | null;

        if (!response.ok || !result?.success) {
          const nextErrors = result?.errors ?? {};
          setErrorMessage(result?.message ?? "Gagal menyimpan murid.");
          setFieldErrors({
            name: nextErrors.name,
            nis: nextErrors.nis
          });
          if (nextErrors.name || nextErrors.nis) {
            setCurrentStep(1);
          }
          return;
        }

        router.push("/students");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan murid.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Tambah Murid Baru</h1>
          <p className="mt-1 text-sm text-slate-600">Wizard multi-langkah untuk data murid.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {stepTitle}
        </div>
      </div>

      <StepIndicator currentStep={currentStep} />

      {errorMessage ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        {currentStep === 1 ? (
          <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Langkah 1: Data Pribadi</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="NIS" value={formData.nis} onChange={(value) => updateField("nis", value.replace(/\D/g, ""))} required inputMode="numeric" pattern="[0-9]*" />
              {fieldErrors.nis ? <p className="-mt-2 text-xs text-red-600 md:col-span-2">{fieldErrors.nis}</p> : null}
              <Input label="Nama Lengkap" value={formData.name} onChange={(value) => updateField("name", value)} required />
              {fieldErrors.name ? <p className="-mt-2 text-xs text-red-600 md:col-span-2">{fieldErrors.name}</p> : null}
              <SelectInput label="Jenis Kelamin" value={formData.gender} onChange={(value) => updateField("gender", value)} options={["", "Laki-laki", "Perempuan"]} />
              <Input label="Tempat Lahir" value={formData.placeOfBirth} onChange={(value) => updateField("placeOfBirth", value)} />
              <DatePickerField
                label="Tanggal Lahir"
                value={formData.dateOfBirth}
                onChange={(value) => updateField("dateOfBirth", value)}
                inputRef={dateInputRef}
                onOpen={openDatePicker}
                formatDateForDisplay={formatDateForDisplay}
              />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-yellow-500 focus:ring-2"
                />
              </div>
            </div>
          </fieldset>
        ) : null}

        {currentStep === 2 ? (
          <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Langkah 2: Data Orang Tua / Wali</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nama Ayah" value={formData.fatherName} onChange={(value) => updateField("fatherName", value)} />
              <Input label="Nama Ibu" value={formData.motherName} onChange={(value) => updateField("motherName", value)} />
              <Input label="Nomor Telepon" value={formData.parentPhone} onChange={(value) => updateField("parentPhone", value.replace(/[^\d+]/g, ""))} inputMode="tel" placeholder="+62812..." />
              <Input label="Pekerjaan" value={formData.parentJob} onChange={(value) => updateField("parentJob", value)} />
            </div>
          </fieldset>
        ) : null}

        {currentStep === 3 ? (
          <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Langkah 3: Riwayat Akademik</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Sekolah Sebelumnya" value={formData.previousSchool} onChange={(value) => updateField("previousSchool", value)} />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Ringkasan Rapor / URL</label>
                <textarea
                  value={formData.previousReportCardSummary}
                  onChange={(event) => updateField("previousReportCardSummary", event.target.value)}
                  className="min-h-28 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-yellow-500 focus:ring-2"
                />
              </div>
            </div>
          </fieldset>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => router.push("/students")}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || isPending}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                ← Kembali
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Lanjut →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}

function Input({ label, value, onChange, type = "text", required = false, inputMode, pattern, placeholder, lang }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; inputMode?: "search" | "email" | "none" | "decimal" | "text" | "tel" | "url" | "numeric"; pattern?: string; placeholder?: string; lang?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        inputMode={inputMode}
        pattern={pattern}
        placeholder={placeholder}
        lang={lang}
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
      />
    </div>
  );
}

function DatePickerField({
  label,
  value,
  onChange,
  inputRef,
  onOpen,
  formatDateForDisplay
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  onOpen: () => void;
  formatDateForDisplay: (value: string) => string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={formatDateForDisplay(value)}
          placeholder="DD/MM/YYYY"
          onClick={onOpen}
          className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm outline-none ring-yellow-500 focus:ring-2"
        />
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500"
          aria-label="Pilih tanggal"
        >
          📅
        </button>
        <input
          ref={(node) => {
            inputRef.current = node;
          }}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "Pilih gender"}
          </option>
        ))}
      </select>
    </div>
  );
}
