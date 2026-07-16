"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { useTenant } from "../../../components/tenant-context";
import { getHomeroomTeachers } from "../../actions/academics";
import { createClassroom, getClassrooms } from "../../actions/classrooms";

type ClassroomCard = {
  id: string;
  name: string;
  academicYear: string;
  semester: number;
  createdAt: string;
  homeroomTeacher: {
    id: string;
    nip: string;
    name: string;
  };
  students: Array<{
    id: string;
    nis: string;
    name: string;
    isActive: boolean;
  }>;
  courseOfferings: Array<{
    id: string;
    term: string;
    courseName: string;
    courseCode: string;
  }>;
};

type TeacherOption = {
  id: string;
  nip: string;
  name: string;
};

type ClassroomFormErrors = {
  name?: string;
  academicYear?: string;
  semester?: string;
  homeroomTeacherId?: string;
};

function ClassroomSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-3 h-5 animate-pulse rounded bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClassroomsPage() {
  const { selectedTenant, activeTenantLabel } = useTenant();

  const [classrooms, setClassrooms] = useState<ClassroomCard[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: "",
    academicYear: "",
    semester: "1",
    homeroomTeacherId: ""
  });
  const [errors, setErrors] = useState<ClassroomFormErrors>({});

  async function loadClassroomData() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [classroomRows, teacherRows] = await Promise.all([
        getClassrooms(selectedTenant),
        getHomeroomTeachers(selectedTenant)
      ]);

      setClassrooms(classroomRows as ClassroomCard[]);
      setTeacherOptions(teacherRows as TeacherOption[]);
      setForm((previous) => ({
        ...previous,
        homeroomTeacherId: previous.homeroomTeacherId || teacherRows[0]?.id || ""
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data rombel.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function syncClassroomData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [classroomRows, teacherRows] = await Promise.all([
          getClassrooms(selectedTenant),
          getHomeroomTeachers(selectedTenant)
        ]);

        if (!isActive) {
          return;
        }

        setClassrooms(classroomRows as ClassroomCard[]);
        setTeacherOptions(teacherRows as TeacherOption[]);
        setForm((previous) => ({
          ...previous,
          homeroomTeacherId: previous.homeroomTeacherId || teacherRows[0]?.id || ""
        }));
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data rombel.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void syncClassroomData();

    return () => {
      isActive = false;
    };
  }, [selectedTenant]);

  function closeModal() {
    setIsModalOpen(false);
    setErrors({});
  }

  function handleCreateClassroom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setErrors({});
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await createClassroom(selectedTenant, {
        name: form.name,
        academicYear: form.academicYear,
        semester: Number(form.semester),
        homeroomTeacherId: form.homeroomTeacherId
      });

      if (!result.success) {
        setErrors(result.errors ?? {});
        setErrorMessage(result.error);
        return;
      }

      setForm({
        name: "",
        academicYear: "",
        semester: "1",
        homeroomTeacherId: teacherOptions[0]?.id || ""
      });
      setSuccessMessage("Kelas baru berhasil dibuat.");
      closeModal();
      await loadClassroomData();
    });
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Rombel / Kelas Aktif</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola kelas aktif untuk tenant: {activeTenantLabel} ({selectedTenant})
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Buat Kelas Baru</Button>
      </div>

      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div> : null}
      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div>
      ) : null}

      {isLoading ? (
        <ClassroomSkeleton />
      ) : classrooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Belum ada rombongan belajar. Klik + Buat Kelas Baru untuk mulai.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {classrooms.map((classroom) => (
            <article key={classroom.id} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">{classroom.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {classroom.academicYear} • Semester {classroom.semester}
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Wali Kelas</dt>
                  <dd className="text-right font-medium text-slate-900">{classroom.homeroomTeacher.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">NIP</dt>
                  <dd className="text-right font-medium text-slate-900">{classroom.homeroomTeacher.nip}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Total Siswa</dt>
                  <dd className="font-semibold text-slate-900">{classroom.students.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Mapel Terhubung</dt>
                  <dd className="font-semibold text-slate-900">{classroom.courseOfferings.length}</dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <Link
                  href={`/academics/classrooms/${classroom.id}`}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Lihat Detail
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} title="Buat Kelas Baru" onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleCreateClassroom}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="classroom-name">
              Nama Kelas
            </label>
            <input
              id="classroom-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Contoh: Kelas 1A"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="classroom-year">
              Tahun Ajaran
            </label>
            <input
              id="classroom-year"
              type="text"
              value={form.academicYear}
              onChange={(event) => setForm((previous) => ({ ...previous, academicYear: event.target.value }))}
              placeholder="Contoh: 2026/2027"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            />
            {errors.academicYear ? <p className="mt-1 text-xs text-red-600">{errors.academicYear}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="classroom-semester">
              Semester
            </label>
            <select
              id="classroom-semester"
              value={form.semester}
              onChange={(event) => setForm((previous) => ({ ...previous, semester: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            >
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
            {errors.semester ? <p className="mt-1 text-xs text-red-600">{errors.semester}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="homeroom-teacher">
              Wali Kelas
            </label>
            <select
              id="homeroom-teacher"
              value={form.homeroomTeacherId}
              onChange={(event) => setForm((previous) => ({ ...previous, homeroomTeacherId: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-yellow-500 focus:ring-2"
            >
              <option value="">Pilih wali kelas</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.nip} - {teacher.name}
                </option>
              ))}
            </select>
            {errors.homeroomTeacherId ? <p className="mt-1 text-xs text-red-600">{errors.homeroomTeacherId}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={closeModal}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Kelas"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
